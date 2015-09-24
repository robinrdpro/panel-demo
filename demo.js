
// NOOP Junk forced on us by app_manager
$.widget('ui.placeholder', {});
$.widget('tivo.welcomeAction', {});


// NOOP stuff we don't need from the bloated content_details_panel widget, or that should be part of it's source file
// $.widget('tivo.actionsButtonList', {});
$.widget('tivo.wishListAction', {});

$.widget('tivo.castAndCrewCarousel', {});
$.widget('tivo.notificationMessage', {});
$.widget('tivo.creditsList', {});
$.widget("tivo.programAvailability", {});


// New basic feedItem
$.widget("tivo.feedItem", {
    _create: function() {
        var myWidget = this;
        var $myElement = $(this.element);
        var feedItemModel = this.options.feedItemModel || {};
        var isMovie  = feedItemModel.collectionType != 'series';

        $myElement.toggleClass('mov', isMovie);
        $myElement.toggleClass('tv', ! isMovie);


        var collectionId = feedItemModel.collectionId.split('.')[1];
        var firstSubFolder = collectionId.substr(collectionId.length - 6, 3);
        var secondSubFolder = collectionId.substr(collectionId.length - 3);
        var prefix = isMovie ? "moviePoster" : "showcaseBanner";
        var bannerSize = isMovie ? "_100x150" : "_200x150";

        // Flickity does not use jQuery, so it has to be an attriute (dont use $.data())
        $myElement.find('img').attr('data-flickity-lazyload', TVE_dynamicImageBaseUrl + 'collection/' + firstSubFolder + '/' +
                secondSubFolder + '/' + collectionId + '/' + prefix + bannerSize + '.jpg');

        // this._hoverable($myElement.find(this.options.hoverSelector));
        $myElement.mouseenter(function() {
            if ($myElement.is('.ui-state-selected')) {
                return;
            }
            var $img = $(this).find('.img-container');
            var offset = $img.offset();
            var $positionedParent = $img.parents('.flickity-viewport');
            // var width = $img.width();
            // var height = $img.height();
            var cl = $img.clone();
            // $(cl).width(width);
            // $(cl).height(width);
            $(cl).css("position", "absolute");

            $(cl).insertAfter($positionedParent).offset(offset).addClass('ui-state-hover');

            $(cl).mouseleave(function() {
                $(this).remove();
            });
            $(cl).click(function(event) {
                $(this).remove();
                myWidget._elementClickHandler(event);
            });
        });

        $myElement.click($.proxy(myWidget._elementClickHandler, myWidget));
    },

    _elementClickHandler: function(event) {
        var myWidget = this;
        var $myElement = $(this.element);

        if ($myElement.is('.ui-state-selected')) {
            return false;
        }
        var eventHandled = event.isDefaultPrevented();
        if (! eventHandled) {
            eventHandled = ! myWidget._trigger("onClick", event, myWidget.options.feedItemModel);
            if (eventHandled) {
                event.preventDefault();
            }
        }
    },


});
debug=console;
TVE_mso='tivo';
TVE_dynamicImageBaseUrl = 'http://i-stg.tivo.com/images-staging/';
TVE_channelLogoBaseUrl = 'http://i.tivo.com/images-static/logos/';
TVE_staticImageBaseUrl = 'http://i.tivo.com/images-static/';
TVE_imageBaseURL = '/assets/tve/tivo/img';

$(function() {

    var lastSelected;

    $.ajaxSetup({
        xhrFields: {
            withCredentials: true
        },
        crossDomain: true 
    });

    function feedItemClickHandler(event, feedItem) {
        $selectedElement = $(this);

        $('li.mov, li.tv').removeClass('ui-state-selected');

        $selectedElement.addClass('ui-state-selected');

        function renderNewDescripiton() {

            // var templateName = false ? 'guide-content-details-movie-template' : 'guide-content-details-tv-template';
            var templateName = 'feed-content-details-template';
            var html = Templates.render(templateName, i18n.allMsgs());
            var $description = $(html).insertBefore($selectedElement.parents('div.feed-carousel'));
            lastSelected = $description.uniqueId().attr('id');
            
           
            var $value = $description.contentDetailPanel({
                collectionId: feedItem.contentId ? undefined : feedItem.collectionId,
                contentId: feedItem.contentId
            });

            $value.find('button.close').click(function(event) {
                $('#' + lastSelected).transit({scaleX: 0}, 100, "easeInOut", function() {
                    $(this).remove();
                    lastSelected = null;
                    $selectedElement.removeClass('ui-state-selected');
                });
            })
            // $value.scaleX(0);
            return $value;
        }


        function infoPanelAnimaton(panel) {
            $(panel).transit({scaleX: 0}, 0, "linear")
                    .transit({scaleX: 1}, 300, "ease");
        }
        if (lastSelected) {
            $('#' + lastSelected).transit({scaleX: 0}, 300, "ease", function() {
                $(this).remove();   
                var $last = renderNewDescripiton();
                $last.scrollintoview({duration: 1000, direction: "vertical"});
                infoPanelAnimaton($last);
            });
        } else {
            var $last = renderNewDescripiton();
            $last.scrollintoview({duration: 1000, direction: "vertical"});
            infoPanelAnimaton($last);
        }

        return false;
    }

    function createFeed($element, feedName) {
        $element.feedList({
            ajaxQuery: loadFeed(feedName),
            itemsSelector:'.items',
            feedItemTemplateName: 'feed-template',
            itemEffect: null,
            onFeedUpdated: function(event, feedList) {
                var $this = $(this);    

                console.log("Feed: " + feedName + ", Items: " + $this.find('.items').children().length);
                $this.find('ul.items').flickity({
                    cellAlign: 'left',
                    lazyLoad: 'visible',
                    pageDots: false,
                    percentPosition: false,
                    contain: true
                });
            },

            onClick: feedItemClickHandler
        });        
    }

    $('div[data-feed-name]').each(function() {
        var feedName = $(this).data('feed-name');
        var $element = $(this);

        createFeed($element, feedName);
    });

    function feedLoaded($feedContainer) {
        $feedContainer.flickity({
              cellAlign: 'left',
              lazyLoad: 10,
              pageDots: false,
              percentPosition: false,
              contain: true
        });
    }


    function loadFeed(feedName) {
        return $.get(feedName + '.json');
        // return $.get('http://tivo-localhost/tve/ajax/start/' + feedName);
    }

    window.CollectionProgramAvailability = {
        getData: function(opts) {
            // return $.get('http://tivo-localhost/tve/content/availability/collection/' + opts.collectionId);
            var id = opts.collectionId.split('.')[1] || collectionId;
            // return $.get(id + "_availability.json")
            return $.get("all_availability.json")
        },

        listen: function(){}
    }
    window.CollectionSummary = {
        getData: function(opts) {
            var id = opts.collectionId.split('.')[1] || collectionId;
            // return $.get('http://tivo-localhost/tve/content/info/collection/' + opts.collectionId);
            return $.get(id + "_info.json"); 
        }
    }

    window.ContentProgramAvailability = {
        getData: function(opts) {
            var id = opts.contentId.split('.')[1] || contentId;
            return $.get(id + "_content_availability.json").then(function(availability) {
                var onlinePartners = availability.watchOnlinePartners || [];
                onlinePartners.push({
                    javaClass: "WatchOnlineOffer",
                    displayName: "huluplus",
                    partnerLogo: "ContentSupplier/38x30/1005001.png"
                });                
                onlinePartners.push({
                    javaClass: "WatchOnlineOffer",
                    displayName: "amazon prime",
                    partnerLogo: "ContentSupplier/38x30/1006011.png"
                });                
                return availability;
           })
        },
        listen: function(){}
    }
    window.ContentSummary = {
        getData: function(opts) {
            // return $.get('http://tivo-localhost/tve/content/info/content/' + opts.contentId)
            var id = opts.contentId.split('.')[1] || contentId;
            return $.get(id + "_content_info.json");
        }
    }

    window.SubscriptionSummary = {
        getData: function(opts) {
            return $.get('all_subscriptionSummary.json');
        },
        listen: function(){}
    }

});