'use strict';
define(['brease'], function ({ core: { Class } }) {

    var ModuleClass = Class.extend(function EditorHandles(widget) {
            Class.call(this);
            this.widget = widget;
            this.boxSize = {};
        }, null),

        p = ModuleClass.prototype;

    p.getHandles = function () {

        var self = this;
        return {
            moveHandles: undefined, /* use default*/
            pointHandles: [],
            resizeHandles: [{
                start: function () {
                },
                update: function (newBox) {
                    self.boxSize = newBox;
                    self.widget.el.css('top', parseInt(newBox.top, 10))
                        .css('left', parseInt(newBox.left, 10))
                        .css('width', parseInt(newBox.width, 10))
                        .css('height', parseInt(newBox.height, 10));
                    self.widget._setWidth(newBox.width);
                    self.widget._setHeight(newBox.height);
                    self.widget._refreshScroller();
                },
                finish: function () {
                    return self.boxSize;
                },
                handle: function () {
                    return self.widget.elem;
                }
            }]
        };
    };

    p.getSelectionDecoratables = function () {
        return [this.widget.elem];
    };

    return ModuleClass;

});
