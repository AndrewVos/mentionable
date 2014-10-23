!function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    factory(require('jquery'));
  } else {
    factory(root.jQuery);
  }
}(this, function($) {
  'use strict';

  var defaults = {
    onSearch: $.noop,
    selector: null
  };

  var Mentionable = function(element, options) {
    this.element = element;
    this.options = options;
    this.dropDown = $("<div class='mentionable-dropdown'><ul></ul></div>");
    this.dropDownSelectedIndex = 0;

    this.attachEvents();
  };

  Mentionable.prototype = {
    constructor: Mentionable,

    getCaretPosition: function(element) {
      if (typeof element.selectionStart !== 'undefined') {
        return element.selectionStart;
      } else if (document.selection) {
        var range = document.selection.createRange();
        var rangeLength = range.text.length;
        range.moveStart('character', -element.value.length);
        return range.text.length - rangeLength;
      }
    },

    showDropDown: function(element, query, results) {
      if (results.length == 0) {
        return;
      }

      this.dropDown.show();

      this.element.append(this.dropDown);
      var ul = this.dropDown.find("ul");
      ul.empty();
      this.dropDownSelectedIndex = null;

      $.each(results, function(index, result) {
        var self = this;

        if (this.dropDownSelectedIndex === null) {
          if (result.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
            this.dropDownSelectedIndex = index;
          }
        }

        var li = $("<li></li>");
        li.on('click', function() {
          element.focus();
          self.completeCurrentItem(element);
        });

        li.on("mouseenter.mentionable", function() {
          self.dropDownSelectedIndex = $(this).index();
          self.reshowHighlightedItem();
        });

        if (result.image !== undefined) {
          var img = $("<img>", {
            'class': 'profile-image',
            'src': result.image,
            'alt': result.name
          });
          li.append(img);
        }
        li.append("<span class='name'>" + result.name + "</span>");
        ul.append(li);
      }.bind(this));

      if (this.dropDownSelectedIndex === null) {
        this.dropDownSelectedIndex = 0;
      }
      this.reshowHighlightedItem();
    },

    reshowHighlightedItem: function() {
      this.dropDown.find("li").removeClass("focused");
      var selected = $(this.dropDown.find("li")[this.dropDownSelectedIndex]);
      selected.addClass("focused");
    },

    moveSelectionDown: function() {
      if (this.dropDownSelectedIndex !== this.dropDown.find("li").length - 1) {
        this.dropDownSelectedIndex += 1;
        this.reshowHighlightedItem();
      }
    },

    moveSelectionUp: function() {
      if (this.dropDownSelectedIndex !== 0) {
        this.dropDownSelectedIndex -= 1;
        this.reshowHighlightedItem();
      }
    },

    completeCurrentItem: function(element) {
      var currentItem = $(this.dropDown.find("li.focused")[0]);
      var caretStart = this.getCaretPosition(element);
      var atIndex = element.val().slice(0, caretStart).lastIndexOf("@");
      var first = element.val().slice(0, atIndex + 1);
      var last = element.val().slice(atIndex + this.currentCompletion(element).length + 1);
      var text = first + currentItem.find(".name").text() + last;
      element.val(text + " ");
      this.hideDropDown();
    },

    currentCompletion: function(element) {
      var caretStart = this.getCaretPosition(element);
      var query = element.val().slice(0, caretStart);
      var matches = query.match(/@[^ ]*$/);
      if (matches !== null) {
        return matches[0].slice(1);
      }
      return null;
    },

    hideDropDown: function() {
      this.dropDown.hide();
    },

    dropDownVisible: function() {
      return this.dropDown.is(":visible");
    },

    attachEvents: function() {
      var self = this;

      $(document).on("keydown.mentionable", this.options.selector, function(event) {
        var element = $(event.target);
        if (self.dropDownVisible() == false) {
          return;
        }
        if (event.keyCode == 13 || event.keyCode == 9) {
          self.completeCurrentItem(element);
          return false;
        } else if (event.keyCode == 38) {
          self.moveSelectionUp();
          return false;
        } else if (event.keyCode == 40) {
          self.moveSelectionDown();
          return false;
        }
      });

      $(document).on("keyup.mentionable", this.options.selector, function(event) {
        var element = $(event.target);
        if (event.keyCode == 13 || event.keyCode == 9 || event.keyCode == 38 || event.keyCode == 40) {
          return;
        }
        if (event.keyCode == 27 && self.dropDownVisible()) {
          return self.hideDropDown();
        }
        var completion = self.currentCompletion(element);
        if (completion !== null) {
          self.options.onSearch(completion, function(results) {
            self.showDropDown(element, completion, results);
          });
        } else {
          self.hideDropDown();
        }
      });
    }

  };

  $.fn.mentionable = function(options) {
    options = $.extend(true, {}, defaults, options);

    return this.each(function() {
      var $this = $(this);
      $this.data('mentionable', new Mentionable($this, options));
    });
  };

  $.fn.mentionable.defaults = defaults;
  $.fn.mentionable.Mentionable = Mentionable;
});
