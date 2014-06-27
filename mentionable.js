var Mentionable = function(selector, callback) {
  self = this;

  this.getCaretPosition = function(element) {
    if (typeof element.selectionStart !== 'undefined') {
      return element.selectionStart;
    } else if (document.selection) {
      var range = document.selection.createRange();
      var rangeLength = range.text.length;
      range.moveStart('character', -element.value.length);
      return range.text.length - rangeLength;
    }
  };

  this.dropDown = $("<div class='mentionable-dropdown'><ul></ul></div>");
  this.dropDownSelectedIndex = 0;

  this.showDropDown = function(element, query, results) {
    if (results.length > 0) {
      self.dropDown.width(element.outerWidth());
      self.dropDown.css("left", element.offset().left);
      self.dropDown.css("top", element.offset().top + element.outerHeight());
      self.dropDown.show();

      $("body").append(self.dropDown);
      var ul = self.dropDown.find("ul");
      ul.empty();
      self.dropDownSelectedIndex = null;

      for (i = 0; i < results.length; i++) {
        if (self.dropDownSelectedIndex === null) {
          if (results[i].name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
            self.dropDownSelectedIndex = i;
          }
        }

        var li = $("<li></li>");
        li.click(function() {
          element.focus();
          self.completeCurrentItem(element);
        });

        li.on("mouseenter", function() {
          self.dropDownSelectedIndex = $(this).index();
          self.reshowHighlightedItem();
        });

        if (results[i].image !== undefined) {
          var img = $("<img>");
          img.attr("class", "profile-image");
          img.attr("src", results[i].image);
          img.attr("alt", results[i].name);
          li.append(img);
        }
        li.append("<span class='name'>"+results[i].name+"</span>");
        ul.append(li);
      }
      if (self.dropDownSelectedIndex === null) {
        self.dropDownSelectedIndex = 0;
      }
      self.reshowHighlightedItem();
    }
  };

  this.reshowHighlightedItem = function() {
    self.dropDown.find("li").removeClass("focused");
    var selected = $(self.dropDown.find("li")[self.dropDownSelectedIndex]);
    selected.addClass("focused");
  };

  this.moveSelectionDown = function() {
    if (self.dropDownSelectedIndex !== self.dropDown.find("li").length -1) {
      self.dropDownSelectedIndex += 1;
      self.reshowHighlightedItem();
    }
  };

  this.moveSelectionUp = function() {
    if (self.dropDownSelectedIndex !== 0) {
      self.dropDownSelectedIndex -= 1;
      self.reshowHighlightedItem();
    }
  };

  this.completeCurrentItem = function(element) {
    var currentItem = $(self.dropDown.find("li.focused")[0]);
    var caretStart = self.getCaretPosition(element);
    var atIndex = element.val().slice(0, caretStart).lastIndexOf("@");
    var first = element.val().slice(0, atIndex + 1);
    var last = element.val().slice(atIndex + self.currentCompletion(element).length + 1);
    var text = first + currentItem.find(".name").text() + last;
    element.val(text + " ");
    self.hideDropDown();
  };

  this.hideDropDown = function() {
    self.dropDown.hide();
  };

  this.dropDownVisible = function() {
    return self.dropDown.is(":visible");
  };

  $(document).on("keydown", selector, function(event) {
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

  self.currentCompletion = function(element) {
    var caretStart = self.getCaretPosition(element);
    var query = element.val().slice(0, caretStart);
    var matches = query.match(/@[^ ]*$/);
    if (matches !== null) {
      return matches[0].slice(1);
    }
    return null;
  };


  $(document).on("keyup", selector, function(event) {
    var element = $(event.target);
    if (event.keyCode == 13 || event.keyCode == 9 || event.keyCode == 38 || event.keyCode == 40) {
      return;
    }
    var completion = self.currentCompletion(element);
    if (completion !== null) {
      callback(completion, function(results) {
        self.showDropDown(element, completion, results);
      });
    } else {
      self.hideDropDown();
    }
  });
}
