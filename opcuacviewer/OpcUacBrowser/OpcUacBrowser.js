"use strict";
define(["widgets/brease/common/libs/wfUtils/UtilsImage", "brease"], function (
    UtilsImage,
    {
        services: { opcua },
        config: breaseConfig,
        core: { BaseWidget: SuperClass },
        helper: { scroller },
    }
) {
    /**
     * @class widgets.opcuacviewer.OpcUacBrowser
     * This widget is a OpcUa client browser for exploring OpcUa server
     * @extends brease.core.BaseWidget
     *
     * @iatMeta category:Category
     * Numeric
     * @iatMeta description:de
     * Opcua client browser
     * @iatMeta description:en
     * Opcua client browser
     */

    /**
     * @cfg {String} serverAlias=''
     * @iatCategory Behavior
     * @iatStudioExposed
     * Server alias of the server opcua you want to explore
     */

    /**
    * @cfg {String} selectedNodeId=''
    * @iatStudioExposed
    * @bindable
    * Actual selected nodeId in the tree (eg. NS0|Numeric|85)  
    */

    /**
     * @cfg {ImagePath} imageOpcuaVariable=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @bindable
     * Path to an optional image for opcua variable. 
     */

    /**
     * @cfg {ImagePath} imageOpcuaPackageOpen=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @bindable
     * Path to an optional image for opcua package open. 
     */

    /**
     * @cfg {ImagePath} imageOpcuaPackageClose=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @bindable
     * Path to an optional image for opcua package close. 
     */

    /**
     * @cfg {ImagePath} imageOpcuaMethod=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @bindable
     * Path to an optional image for opcua method. 
     */

    /**
    * @cfg {Boolean} useSVGStyling=true
    * @iatStudioExposed
    * @iatCategory Appearance
    * Define if the image stylings (i.e imageColor) are applied - only valid when SVG Images are used.
    */

    const NODE_CLASSES = {
        1: "Object",
        2: "Variable",
        4: "Method",
        8: "ObjectType",
    };

    const ROOT_OPCUA_NODE = "NS0|Numeric|85";

    const defaultSettings = {
        serverAlias: "",
        selectedNodeId: "",
        imageOpcuaVariable: "",
        imageOpcuaPackageOpen: "",
        imageOpcuaPackageClose: "",
        imageOpcuaMethod: "",
        useSVGStyling: true,
    };

    const WidgetClass = SuperClass.extend(function OpcUacBrowser() {
        SuperClass.apply(this, arguments);
    }, defaultSettings);

    let p = WidgetClass.prototype;

    p.init = function () {
        this.addInitialClass("OpcUacBrowser");
        this.el.addClass("opcuacviewerOpcUaBrowser");

        this.data = {
            serverAlias: this.settings.serverAlias,
            nodes: [],
            selectedNodeId: this.settings.selectedNodeId,
        };

        // Create wrapper for scroll
        this.scrollWrapper = $('<div class="scrollWrapper"/>');

        if (this.settings.imageOpcuaVariable === "") {
            this.settings.imageOpcuaVariable = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaVariable.png';
            this.setImageOpcuaVariable(this.settings.imageOpcuaVariable, true);
        }
        if (this.settings.imageOpcuaPackageOpen === "") {
            this.settings.imageOpcuaPackageOpen = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaPackageOpen.png';
            this.setImageOpcuaPackageOpen(this.settings.imageOpcuaPackageOpen, true);
        }
        if (this.settings.imageOpcuaPackageClose === "") {
            this.settings.imageOpcuaPackageClose = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaPackageClose.png';
            this.setImageOpcuaPackageClose(this.settings.imageOpcuaPackageClose, true);
        }
        if (this.settings.imageOpcuaMethod === "") {
            this.settings.imageOpcuaMethod = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaMethod.png';
            this.setImageOpcuaMethod(this.settings.imageOpcuaMethod, true);
        }

        // Create container for the tree
        this.treeContainer = $('<div class="opcua-treeview"></div>');
        this.scrollWrapper.append(this.treeContainer);

        this.el.append(this.scrollWrapper);

        if (breaseConfig.editMode === true) {
            // Load example nodes in edit mode
            this._loadExampleNodes();
        } else if (this.data.serverAlias !== "") {
            // Load real nodes in runtime mode
            this._loadRootNode();
        }

        this._addScroller();
        this._refreshScroller();

        SuperClass.prototype.init.apply(this, arguments);
    };

    p._loadExampleNodes = function () {
        this._showLoading(true);
        
        // Create mock response with example nodes
        const exampleNodes = {
            status: { code: 0, message: "OK" },
            referenceDescriptions: [
                {
                    nodeId: "NS0|ExampleObject|1",
                    browseName: "0:ExampleObject",
                    displayName: { text: "Example Object" },
                    nodeClass: 1 // Object
                },
                {
                    nodeId: "NS0|ExampleVariable|2",
                    browseName: "0:ExampleVariable",
                    displayName: { text: "Example Variable" },
                    nodeClass: 2 // Variable
                },
                {
                    nodeId: "NS0|ExampleMethod|3",
                    browseName: "0:ExampleMethod",
                    displayName: { text: "Example Method" },
                    nodeClass: 4 // Method
                },
                {
                    nodeId: "NS0|AnotherObject|4",
                    browseName: "0:AnotherObject",
                    displayName: { text: "Another Object" },
                    nodeClass: 1 // Object
                }
            ]
        };
    
        // Simulate async loading with timeout for better UX
        setTimeout(() => {
            this._renderNode(null, exampleNodes);
            this._showLoading(false);
        }, 500);
    };



    p._addScroller = function () {
        this.scroller = scroller.addScrollbars(this.el[0], {
            scrollbars: "custom",
            mouseWheel: true,
            tap: true,
            scrollY: true,
            scrollX: true,
            freeScroll: true,
            bounce: false,
            fadeScrollbars: false,
            momentum: true,
            resizeScrollbars: true,
            disablePointer: true,
            HWCompositing: false
        });
    
        // Add resize handler to refresh scroller when widget size changes
        this._handleResize = this._refreshScroller.bind(this);
        window.addEventListener('resize', this._handleResize);
    };


    p._refreshScroller = function () {
        if (this.scroller) {
            // Use a small timeout to ensure DOM updates are complete
            window.clearTimeout(this.refreshTimeOutScroller);
            this.refreshTimeOutScroller = window.setTimeout(() => {
                if (this.scroller && this.scroller.refresh) {
                    this.scroller.refresh();
                }
            }, 100);
        }
    };

    p.destroy = function () {
        if (this.scroller) {
            this.scroller.destroy();
            this.scroller = null;
        }
        
        if (this._handleResize) {
            window.removeEventListener('resize', this._handleResize);
            this._handleResize = null;
        }
        
        window.clearTimeout(this.refreshTimeOutScroller);
        
        SuperClass.prototype.destroy.apply(this, arguments);
    };


    p._loadRootNode = function () {
        this._showLoading(true);
        opcua
            .browse(ROOT_OPCUA_NODE, this.data.serverAlias)
            .then((nodes) => {
                if (nodes.status.code === 0) {
                    this._renderNode(null, nodes); // Render root level
                    this._showLoading(false);
                } else {
                    this._showError(
                        "Failed to load root node, error code: ",
                        nodes.status.code,
                        " message: ",
                        nodes.status.message
                    );
                }
            })
            .catch((error) => {
                console.error("Root browse failed:", error);
                this._showError("Failed to load root node");
            });
    };

    p._renderNode = function (parentId, nodes) {
        const ul = parentId
            ? $(`#${parentId}`).find("ul")
            : $('<ul class="opcua-tree-root"></ul>');

        if (!parentId) {
            this.treeContainer.empty().append(ul);
        }

        // Create a Set to track unique nodeIds
        const uniqueNodeIds = new Set();

        nodes.referenceDescriptions.forEach((node) => {
            // Skip non-browsable nodes and duplicates
            if (
                (node.nodeClass === 1 || node.nodeClass === 2 || node.nodeClass === 4) &&
                !uniqueNodeIds.has(node.nodeId)
            ) {
                uniqueNodeIds.add(node.nodeId); // Mark this nodeId as seen

                const li = $('<li class="opcua-node"></li>');
                const nodeId = node.nodeId.replace(/[^a-zA-Z0-9]/g, "_");

                // Node icon based on type
                const icon = $('<img class="opcua-icon" src="" alt="">').addClass(
                    `opcua-${NODE_CLASSES[node.nodeClass].toLowerCase()}`
                );
                icon.hide();

                const svgIcon = $('<svg class="opcua-icon"></svg>').addClass(
                    `opcua-${NODE_CLASSES[node.nodeClass].toLowerCase()}`
                );
                svgIcon.hide();

                if (node.nodeClass === 1){
                    icon.addClass("collapsed");
                }

                // Node name
                const name = $('<span class="opcua-name"></span>').text(
                    node.displayName.text || node.browseName.split("|")[1]
                );

                li.append(icon, name, svgIcon)
                    .attr("data-nodeid", node.nodeId)
                    .attr("id", `node_${nodeId}`);

                // Add expander for objects
                if (node.nodeClass === 1) {
                    // Placeholder for children
                    li.append($('<ul style="display:none;"></ul>'));

                    // Click handler for lazy loading
                    icon.on("click", (e) => {
                        e.stopPropagation();
                        this._toggleNode(li, node);
                    });

                    svgIcon.on("click", (e) => {
                        e.stopPropagation();
                        this._toggleNode(li, node);
                    });

                    name.on("click", (e) => {
                        e.stopPropagation();
                        this._toggleNode(li, node);
                    });
                }

                // Add click handler for variables/methods
                if (node.nodeClass === 2 || node.nodeClass === 4) {
                    icon.on("click", () => this._onNodeClick(node));
                    svgIcon.on("click", () => this._onNodeClick(node));
                    name.on("click", () => this._onNodeClick(node));
                }

                ul.append(li);
                this.data.nodes[node.nodeId] = node; // Cache the node
            }
        });
        // Refresh scroller after rendering
        this.setImageOpcuaVariable(this.settings.imageOpcuaVariable, true);
        this.setImageOpcuaPackageOpen(this.settings.imageOpcuaPackageOpen, true);
        this.setImageOpcuaPackageClose(this.settings.imageOpcuaPackageClose, true);
        this.setImageOpcuaMethod(this.settings.imageOpcuaMethod, true);
        this._refreshScroller();
    };

    p._toggleNode = function (li, node) {
        this.data.selectedNodeId = node.nodeId;
        const icon = li.children(".opcua-icon");
        const childList = li.children("ul");
    
        if (childList.is(":visible")) {
            childList.hide();
            icon.removeClass("expanded").addClass("collapsed")

            // Or if not using transform: expander.text("▶");
        } else {
            if (childList.children().length === 0) {
                icon.removeClass("collapsed").addClass("expanded")
                // Or if not using transform: expander.text("⌛");
                if (breaseConfig.editMode === true) {
                    this._loadExampleChildren(node.nodeId, li);
                } else {
                    this._loadChildren(node.nodeId, li);
                }
            } else {
                childList.show();
                icon.removeClass("collapsed").addClass("expanded")
                // Or if not using transform: expander.text("▼");
            }
        }
        this.setImageOpcuaPackageOpen(this.settings.imageOpcuaPackageOpen, true);
        this.setImageOpcuaPackageClose(this.settings.imageOpcuaPackageClose, true);
        this._refreshScroller();
    };

    p._loadExampleChildren = function (nodeId, parentLi) {
    
        // Simulate async loading
        setTimeout(() => {
            const exampleChildren = {
                status: { code: 0, message: "OK" },
                referenceDescriptions: []
            };
    
            // Add different children based on the parent node
            if (nodeId.includes("ExampleObject")) {
                exampleChildren.referenceDescriptions = [
                    {
                        nodeId: "NS0|ChildVariable|5",
                        browseName: "0:ChildVariable",
                        displayName: { text: "Child Variable" },
                        nodeClass: 2 // Variable
                    },
                    {
                        nodeId: "NS0|ChildObject|6",
                        browseName: "0:ChildObject",
                        displayName: { text: "Child Object" },
                        nodeClass: 1 // Object
                    }
                ];
            } else if (nodeId.includes("AnotherObject")) {
                exampleChildren.referenceDescriptions = [
                    {
                        nodeId: "NS0|Temperature|7",
                        browseName: "0:Temperature",
                        displayName: { text: "Temperature" },
                        nodeClass: 2 // Variable
                    },
                    {
                        nodeId: "NS0|Pressure|8",
                        browseName: "0:Pressure",
                        displayName: { text: "Pressure" },
                        nodeClass: 2 // Variable
                    }
                ];
            }
    
            this._renderNode(parentLi.attr("id"), exampleChildren);
            parentLi.find("> ul").show();
        }, 300);
    };

    p._loadChildren = function (nodeId, parentLi) {
        opcua
            .browse(nodeId, this.data.serverAlias)
            .then((children) => {
                this._renderNode(parentLi.attr("id"), children);
                parentLi.find("> ul").show();
            })
            .catch((error) => {
                console.error("Browse failed for", nodeId, error);
            });
    };

    p._onNodeClick = function (node) {
        this.data.selectedNodeId = node.nodeId;
        // Handle variable/method clicks
        console.log("Node clicked:", node);

        if (node.nodeClass === 2) {
            // Variable
            this._readVariable(node.nodeId);
        } else if (node.nodeClass === 4) {
            // Method
            this._showMethodInfo(node.nodeId);
        }
    };

    p._readVariable = function (nodeId) {
        opcua
            .read([
                {
                    nodeId: nodeId,
                    attributeId: 13, // Value attribute
                },
            ], this.data.serverAlias)
            .then((result) => {
                if (result.status.code !== 0) {
                    this._showError(
                        "Failed to read variable, error code: ",
                        result.status.code,
                        " message: ",
                        result.status.message
                    );
                    return;
                }
                // Handle the variable value
                const value = result.results[0].value;
                console.log("OpcUa variable", nodeId, "value:", value);
                // Display value in your UI
            });
    };

    p._showMethodInfo = function (nodeId) {
        console.log("Method selected:", nodeId);
        // Show method call UI
    };

    p._showLoading = function (show) {
        if (show) {
            this.treeContainer.html(
                '<div class="opcua-loading">Loading OPC UA tree...</div>'
            );
        }
        // Refresh scroller after rendering
        this._refreshScroller();
    };

    p._showError = function (message) {
        this.treeContainer.html(`<div class="opcua-error">${message}</div>`);
        // Refresh scroller after rendering
        this._refreshScroller();
    };

    /**
    * @method getSelectedNodeId
    * Get selected node id in the tree
    * @return {String}
    */
    p.getSelectedNodeId = function () {
        return this.data.selectedNodeId;
    };

    /**
     * @method setImageOpcuaVariable
     * @iatStudioExposed
     * Sets an image for opcua variable.
     * @param {ImagePath} image
     */
    p.setImageOpcuaVariable = function (image, omitSettings) {
        //console.debug(WidgetClass.name + '[id=' + this.elem.id + '].setImage:', image, this.settings.imageAlign, Enum.ImageAlign.left);
        var widget = this;
        var svgs = widget.el.find('svg.opcua-icon.opcua-variable');
        var imgs = widget.el.find('img.opcua-icon.opcua-variable');
        _rejectImageDeferredIfPending.call(this);
        if (image == undefined || image === '') {
            image = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaVariable.png';
        }

        if (omitSettings !== true) {
            this.settings.imageOpcuaVariable = image;
        }

        if (UtilsImage.isStylable(image) && this.settings.useSVGStyling) {
            this.imageDeferred = UtilsImage.getInlineSvg(image);
            this.imageDeferred.done(function (svgElement) {
                if (svgs.length > 0) {
                    svgs.each(function () {
                        $(this).replaceWith(svgElement);
                    });
                }
                svgs.show();
                imgs.hide();
                widget._refreshScroller();
            });

        } else {
            imgs.each(function () {
                $(this).attr('src', image);
            });
            svgs.hide();
            imgs.show();
            widget._refreshScroller();
        }
        
    };

    /**
     * @method getImageOpcuaVariable
     * Returns the path of the image for opcua variable.
     * @return {ImagePath} text
     */
    p.getImageOpcuaVariable = function () {
        return this.settings.imageOpcuaVariable;
    };

    /**
     * @method setImageOpcuaPackageOpen
     * @iatStudioExposed
     * Sets an image for opcua package Open.
     * @param {ImagePath} image
     */
    p.setImageOpcuaPackageOpen = function (image, omitSettings) {
        var widget = this;
        var svgs = widget.el.find('svg.opcua-icon.opcua-object.expanded');
        var imgs = widget.el.find('img.opcua-icon.opcua-object.expanded');
        _rejectImageDeferredIfPending.call(this);

        if (image == undefined || image === '') {
            image = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaPackageOpen.png';
        }

        if (omitSettings !== true) {
            this.settings.imageOpcuaPackageOpen = image;
        }

        if (UtilsImage.isStylable(image) && this.settings.useSVGStyling) {
            this.imageDeferred = UtilsImage.getInlineSvg(image);
            this.imageDeferred.done(function (svgElement) {
                if (svgs.length > 0) {
                    svgs.each(function () {
                        $(this).replaceWith(svgElement);
                    });
                }
                svgs.show();
                imgs.hide();
                widget._refreshScroller();
            });

        } else {
            imgs.each(function () {
                $(this).attr('src', image);
            });
            svgs.hide();
            imgs.show();
            widget._refreshScroller();
        }
    };

    /**
     * @method getImageOpcuaPackageOpen
     * Returns the path of the image for opcua package open.
     * @return {ImagePath} text
     */
    p.getImageOpcuaPackageOpen = function () {
        return this.settings.imageOpcuaPackageOpen;
    };

    /**
     * @method setImageOpcuaPackageClose
     * @iatStudioExposed
     * Sets an image for opcua package close.
     * @param {ImagePath} image
     */
    p.setImageOpcuaPackageClose = function (image, omitSettings) {
        var widget = this;
        var svgs = widget.el.find('svg.opcua-icon.opcua-object.collapsed');
        var imgs = widget.el.find('img.opcua-icon.opcua-object.collapsed');
        _rejectImageDeferredIfPending.call(this);
        
        if (image == undefined || image === '') {
            image = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaPackageClose.png';
        }

        if (omitSettings !== true) {
            this.settings.imageOpcuaPackageClose = image;
        }

        if (UtilsImage.isStylable(image) && this.settings.useSVGStyling) {
            this.imageDeferred = UtilsImage.getInlineSvg(image);
            this.imageDeferred.done(function (svgElement) {
                if (svgs.length > 0) {
                    svgs.each(function () {
                        $(this).replaceWith(svgElement);
                    });
                }
                svgs.show();
                imgs.hide();
                widget._refreshScroller();
            });

        } else {
            imgs.each(function () {
                $(this).attr('src', image);
            });
            svgs.hide();
            imgs.show();
            widget._refreshScroller();
        }
        
    }

    /**
     * * @method getImageOpcuaPackageClose
     * Returns the path of the image for opcua package close.
     * @return {ImagePath} text
     */
    p.getImageOpcuaPackageClose = function () {
        return this.settings.imageOpcuaPackageClose;
    }

    /**
     * * @method setImageOpcuaMethod
     * @iatStudioExposed
     * Sets an image for opcua method.
     * @param {ImagePath} image
     */
    p.setImageOpcuaMethod = function (image, omitSettings) {
        var widget = this;
        var svgs = widget.el.find('svg.opcua-icon.opcua-method');
        var imgs = widget.el.find('img.opcua-icon.opcua-method');
        _rejectImageDeferredIfPending.call(this);
        
        if (image == undefined || image === '') {
            image = 'widgets/opcuacviewer/OpcUacBrowser/assets/opcuaMethod.png';
        }

        if (omitSettings !== true) {
            this.settings.imageOpcuaMethod = image;
        }

        if (UtilsImage.isStylable(image) && this.settings.useSVGStyling) {
            this.imageDeferred = UtilsImage.getInlineSvg(image);
            this.imageDeferred.done(function (svgElement) {
                if (svgs.length > 0) {
                    svgs.each(function () {
                        $(this).replaceWith(svgElement);
                    });
                }
                svgs.show();
                imgs.hide();
                widget._refreshScroller();
            });

        } else {
            imgs.each(function () {
                $(this).attr('src', image);
            });
            svgs.hide();
            imgs.show();
            widget._refreshScroller();
        }
    }

    /**
     * * @method getImageOpcuaMethod
     * Returns the path of the image for opcua method.
     * @return {ImagePath} text
     */
    p.getImageOpcuaMethod = function () {
        return this.settings.imageOpcuaMethod;
    }


    function _rejectImageDeferredIfPending() {
        if (this.imageDeferred !== undefined && this.imageDeferred.state() === 'pending') {
            this.imageDeferred.reject();
        }
    }

    // Widget registration
    if (
        window.lib_br &&
        window.lib_br.controller &&
        window.lib_br.controller.widgetRegistry
    ) {
        lib_br.controller.widgetRegistry.define(
            "widgets.opcuacviewer.OpcUacBrowser",
            WidgetClass
        );
    }

    return WidgetClass;
});
