"use strict";
define(["widgets/opcuacviewer/common/libs/wfUtils/UtilsImage", "widgets/opcuacviewer/OpcUacBrowser/libs/EditorHandles", "brease"], function (
    UtilsImage,
    EditorHandles,
    {
        services: { opcua },
        config: breaseConfig,
        core: { BaseWidget: SuperClass, Types, CommonCSSClasses},
        events: { BreaseEvent },
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

    // Configuration constants
    const NODE_CLASSES = {
        1: "Object",
        2: "Variable",
        4: "Method",
        8: "ObjectType",
    };

    const ROOT_OPCUA_NODE = "NS0|Numeric|85";
    const DEFAULT_IMAGES = {
        variable: "widgets/opcuacviewer/OpcUacBrowser/assets/opcuaVariable.png",
        packageOpen:
            "widgets/opcuacviewer/OpcUacBrowser/assets/opcuaPackageOpen.png",
        packageClose:
            "widgets/opcuacviewer/OpcUacBrowser/assets/opcuaPackageClose.png",
        method: "widgets/opcuacviewer/OpcUacBrowser/assets/opcuaMethod.png",
    };

    /**
     * @cfg {String} serverAlias=''
     * @iatCategory Behavior
     * @iatStudioExposed
     * Server alias of the server opcua you want to explore.
     * If empty, the default server will be used.
     */

    /**
     * @cfg {String} selectedNodeId=''
     * @iatStudioExposed
     * @iatCategory Behavior
     * @bindable
     * @not_projectable
     * Actual selected nodeId in the tree (eg. NS0|Numeric|85)
     */

    /**
     * @cfg {String} selectedNodeIdentifier=''
     * @iatStudioExposed
     * @iatCategory Behavior
     * @bindable
     * @not_projectable
     * Actual selected nodeIdentifier in the tree (eg. 85)
     */

    /**
     * @cfg {Integer} selectedNodeNamespaceIndex=0
     * @iatStudioExposed
     * @iatCategory Behavior
     * @bindable
     * @not_projectable
     * Actual selected nodeNamespaceIndex in the tree (eg. 0)
     */

    /**
     * @cfg {Integer} selectedNodeIdentifierType=0
     * @iatStudioExposed
     * @iatCategory Behavior
     * @bindable
     * @not_projectable
     * Actual selected nodeIdentifierType in the tree (eg. 0=Numeric, 1=String, 2=Guid, 3=Opaque)
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

    const WidgetClass = SuperClass.extend(
        function OpcUacBrowser() {
            SuperClass.apply(this, arguments);
        },
        {
            serverAlias: "",
            selectedNodeId: "",
            selectedNodeIdentifier: "",
            selectedNodeNamespaceIndex: 0,
            selectedNodeIdentifierType: 0,
            imageOpcuaVariable: "",
            imageOpcuaPackageOpen: "",
            imageOpcuaPackageClose: "",
            imageOpcuaMethod: "",
            useSVGStyling: true,
        }
    );

    const p = WidgetClass.prototype;

    /* ------------------------- Initialization Methods ------------------------- */

    /**
     * Initialize the widget
     */
    p.init = function () {
        this._initWidgetStructure();
        this._initDefaultImages();
        this._loadInitialData();
        this._initScroller();

        SuperClass.prototype.init.apply(this, arguments);
    };

    // override method called in BaseWidget.init
    p._initEditor = function () {
        this.el.addClass(CommonCSSClasses.EDITOR_OUTLINE);
        var editorHandles = new EditorHandles(this);
        this.getHandles = function () {
            return editorHandles.getHandles();
        };
        this.designer.getSelectionDecoratables = function () {
            return editorHandles.getSelectionDecoratables();
        };
        this.bindEditorEventListeners();
        this.dispatchEvent(new CustomEvent(BreaseEvent.WIDGET_EDITOR_IF_READY, { bubbles: true }));
    };

    p.bindEditorEventListeners = function () {   
        this.elem.addEventListener(BreaseEvent.WIDGET_STYLE_PROPERTIES_CHANGED, this._bind('_refreshScroller'));
        this.elem.addEventListener(BreaseEvent.WIDGET_PROPERTIES_CHANGED, this._bind('_refreshScroller'));
    };

    p._initWidgetStructure = function () {
        this.addInitialClass("OpcUacBrowser");
        this.el.addClass("opcuacviewerOpcUaBrowser");

        this.data = {
            serverAlias: this.settings.serverAlias,
            nodes: [],
            selectedNodeId: this.settings.selectedNodeId,
            selectedNodeIdentifier: this.settings.selectedNodeIdentifier,
            selectedNodeNamespaceIndex: this.settings.selectedNodeNamespaceIndex,
            selectedNodeIdentifierType: this.settings.selectedNodeIdentifierType,
        };

        this.treeContainer = $('<div class="opcua-treeview"></div>');
        this.el.append(this.treeContainer);
    };

    p._initDefaultImages = function () {
        const { variable, packageOpen, packageClose, method } = DEFAULT_IMAGES;

        if (!this.settings.imageOpcuaVariable) {
            this.setImageOpcuaVariable(variable, true);
        }
        if (!this.settings.imageOpcuaPackageOpen) {
            this.setImageOpcuaPackageOpen(packageOpen, true);
        }
        if (!this.settings.imageOpcuaPackageClose) {
            this.setImageOpcuaPackageClose(packageClose, true);
        }
        if (!this.settings.imageOpcuaMethod) {
            this.setImageOpcuaMethod(method, true);
        }
    };

    p._loadInitialData = function () {
        if (breaseConfig.editMode) {
            this._loadExampleNodes();
        } else {
            if (!this.data.serverAlias) {
                console.warn("Server alias is empty. Using the default server.");
            }
            this._loadRootNode();
        }
    };

    p._initScroller = function () {
        this.scroller = scroller.addScrollbars(this.el[0], {
            scrollX: true,
            scrollY: true,
            freeScroll: true,
            mouseWheel: true,
            interactiveScrollbars: true, // Active les scrollbars interactives
            scrollbars: "custom", // Utilise les scrollbars customisées
            fadeScrollbars: false, // Garde toujours les scrollbars visibles
            shrinkScrollbars: "clip",
            probeType: 3,
            bindToWrapper: true,
            useTransform: true,
            useTransition: false,
            bounce: false,
            HWCompositing: true,
        });

        this._handleResize = this._refreshScroller.bind(this);
        window.addEventListener("resize", this._handleResize);
        this._refreshScroller();
    };

    /* ------------------------- Data Loading Methods ------------------------- */

    p._loadExampleNodes = function () {
        this._showLoading(true);

        const exampleNodes = {
            status: { code: 0, message: "OK" },
            referenceDescriptions: [
                {
                    nodeId: "NS0|ExampleObject|1",
                    browseName: "0:ExampleObject",
                    displayName: { text: "Example Object" },
                    nodeClass: 1,
                },
                {
                    nodeId: "NS0|ExampleVariable|2",
                    browseName: "0:ExampleVariable",
                    displayName: { text: "Example Variable" },
                    nodeClass: 2,
                },
                {
                    nodeId: "NS0|ExampleMethod|3",
                    browseName: "0:ExampleMethod",
                    displayName: { text: "Example Method" },
                    nodeClass: 4,
                },
                {
                    nodeId: "NS0|AnotherObject|4",
                    browseName: "0:AnotherObject",
                    displayName: { text: "Another Object" },
                    nodeClass: 1,
                },
            ],
        };

        setTimeout(() => {
            this._showLoading(false);
            this._renderNode(null, exampleNodes);
        }, 500);
    };

    p._loadRootNode = function () {
        this._showLoading(true);
        opcua
            .browse(ROOT_OPCUA_NODE, this.data.serverAlias)
            .then((nodes) => {
                if (nodes.status.code === 0) {
                    this._showLoading(false);
                    this._renderNode(null, nodes);
                } else {
                    this._showError(
                        `Failed to load root node, error code: ${nodes.status.code}, message: ${nodes.status.message}`
                    );
                }
            })
            .catch((error) => {
                console.error("Root browse failed:", error);
                this._showError("Failed to load root node");
            });
    };

    p._loadExampleChildren = function (nodeId, parentLi) {
        // Simulate async loading
        setTimeout(() => {
            const exampleChildren = {
                status: { code: 0, message: "OK" },
                referenceDescriptions: [],
            };

            // Add different children based on the parent node
            if (nodeId.includes("ExampleObject")) {
                exampleChildren.referenceDescriptions = [
                    {
                        nodeId: "NS0|ChildVariable|5",
                        browseName: "0:ChildVariable",
                        displayName: { text: "Child Variable" },
                        nodeClass: 2, // Variable
                    },
                    {
                        nodeId: "NS0|ChildObject|6",
                        browseName: "0:ChildObject",
                        displayName: { text: "Child Object" },
                        nodeClass: 1, // Object
                    },
                ];
            } else if (nodeId.includes("AnotherObject")) {
                exampleChildren.referenceDescriptions = [
                    {
                        nodeId: "NS0|Temperature|7",
                        browseName: "0:Temperature",
                        displayName: { text: "Temperature" },
                        nodeClass: 2, // Variable
                    },
                    {
                        nodeId: "NS0|Pressure|8",
                        browseName: "0:Pressure",
                        displayName: { text: "Pressure" },
                        nodeClass: 2, // Variable
                    },
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

    /* ------------------------- Node Rendering Methods ------------------------- */

    p._renderNode = function (parentId, nodes) {
        const ul = parentId
            ? $(`#${parentId}`).find("ul")
            : $('<ul class="opcua-tree-root"></ul>');

        if (!parentId) this.treeContainer.empty().append(ul);

        const uniqueNodeIds = new Set();

        nodes.referenceDescriptions.forEach((node) => {
            if (
                (node.nodeClass === 1 ||
                    node.nodeClass === 2 ||
                    node.nodeClass === 4) &&
                !uniqueNodeIds.has(node.nodeId)
            ) {
                uniqueNodeIds.add(node.nodeId);
                this._createNodeElement(node, ul);
            }
        });

        this._refreshImages();
        this._refreshScroller();
    };

    p._createNodeElement = function (node, parentUl) {
        const li = $('<li class="opcua-node"></li>');
        const nodeId = node.nodeId.replace(/[^a-zA-Z0-9]/g, "_");
        const nodeContainer = $('<div class="opcua-node-container"></div>');

        // Create icons
        const iconType = `opcua-${NODE_CLASSES[node.nodeClass].toLowerCase()}`;
        const imgIcon = $('<img class="opcua-icon" src="" alt="">')
            .addClass(iconType)
            .hide();
        const svgIcon = $('<svg class="opcua-icon"></svg>')
            .addClass(iconType)
            .hide();

        if (node.nodeClass === 1) {
            imgIcon.addClass("collapsed");
            svgIcon.addClass("collapsed");
        }

        // Node name
        const name = $('<span class="opcua-name"></span>').text(
            node.displayName.text || node.browseName.split("|")[1]
        );

        nodeContainer.append(imgIcon, svgIcon, name);
        li.append(nodeContainer)
            .attr("data-nodeid", node.nodeId)
            .attr("id", `node_${nodeId}`);

        // Setup interaction based on node type
        if (node.nodeClass === 1) {
            li.append($('<ul style="display:none;"></ul>'));
            [imgIcon, svgIcon, name].forEach((el) =>
                el.on("click", (e) => {
                    e.stopPropagation();
                    this._toggleNode(li, node);
                    this._fireNodeClicked(node);
                    this._changeClassSelected(li);
                })
            );
        } else if (node.nodeClass === 2 || node.nodeClass === 4) {
            [imgIcon, svgIcon, name].forEach((el) =>
                el.on("click", () => {
                    this._onNodeClick(node);
                    this._fireNodeClicked(node);
                    this._changeClassSelected(li);
                }));
        }

        parentUl.append(li);
        this.data.nodes[node.nodeId] = node;
    };

    /* ------------------------- Node Interaction Methods ------------------------- */

    p._toggleNode = function (li, node) {
        const childList = li.children("ul");
        const icon = li.find(" > .opcua-node-container > .opcua-icon");

        if (childList.is(":visible")) {
            childList.hide();
            icon.removeClass("expanded").addClass("collapsed");
        } else {
            if (childList.children().length === 0) {
                icon.removeClass("collapsed").addClass("expanded");
                if (breaseConfig.editMode) {
                    this._loadExampleChildren(node.nodeId, li);
                } else {
                    this._loadChildren(node.nodeId, li);
                }
            } else {
                childList.show();
                icon.removeClass("collapsed").addClass("expanded");
            }
        }
        this._refreshImages();
        this._refreshScroller();
    };

    p._onNodeClick = function (node) {
        console.log("Node clicked:", node);

        if (node.nodeClass === 2) {
            this._readVariable(node.nodeId);
        } else if (node.nodeClass === 4) {
            this._showMethodInfo(node.nodeId);
        }

    };

    /* ------------------------- Utility Methods ------------------------- */

    p._changeClassSelected = function (li) {
        $("li.opcua-node.selected").removeClass("selected");
        li.addClass("selected");
    }

    p._refreshImages = function () {
        this.setImageOpcuaVariable(this.settings.imageOpcuaVariable, true);
        this.setImageOpcuaPackageOpen(
            this.settings.imageOpcuaPackageOpen,
            true
        );
        this.setImageOpcuaPackageClose(
            this.settings.imageOpcuaPackageClose,
            true
        );
        this.setImageOpcuaMethod(this.settings.imageOpcuaMethod, true);
    };

    p._refreshScroller = function () {
        if (this.scroller) {
            clearTimeout(this.refreshTimeOutScroller);
            this.refreshTimeOutScroller = setTimeout(() => {
                this.scroller?.refresh?.();
            }, 100);
        }
    };

    p._showLoading = function (show) {
        this.treeContainer.html(
            show
                ? '<div class="opcua-loading">Loading OPC UA tree...</div>'
                : ""
        );
        this._refreshScroller();
    };

    p._showError = function (message) {
        this.treeContainer.html(`<div class="opcua-error">${message}</div>`);
        this._refreshScroller();
    };

    p._readVariable = function (nodeId) {
        if (breaseConfig.editMode) {
            console.warn("OpcUacBrowser: Reading variable in edit mode is not supported.");
            return;
        }
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
        console.warn("OpcUacBrowser: Showing method info is not supported.");
    };


    p._fireNodeClicked = function (node) {

        var nodeId = node.nodeId;
        var NamespaceIndex = parseInt(nodeId.split("|")[0].replace("NS", ""));
        var IdentifierTypeString = nodeId.split("|")[1];
        var IdentifierType;
        switch (IdentifierTypeString) {
            case "Numeric":
                IdentifierType = 0;
                break;
            case "String":
                IdentifierType = 1;
                break;
            case "Guid":
                IdentifierType = 2;
                break;
            case "Opaque":
                IdentifierType = 3;
                break;
            default:
                IdentifierType = -1; // Unknown type
        }
        var Identifier = nodeId.split("|")[2];

        /**
         * @event NodeClicked
         * @iatStudioExposed
         * Fired when node is clicked.
         * 
         * @param {String} NodeId Node Id of the clicked node (eg. NS0|Numeric|85)
         * @param {Integer} NamespaceIndex Namespace index of the clicked node (eg. 0)
         * @param {Integer} IdentifierType Identifier type of the clicked node, based on UAIdentifierType enum (Numeric=0, String=1, Guid=2, Opaque=3)
         * @param {String} Identifier Idenfier of the clicked node (eg. 85)
         */
        this.dispatchServerEvent('NodeClicked', {
                NodeId: nodeId,
                NamespaceIndex: NamespaceIndex,
                IdentifierType: IdentifierType,
                Identifier: Identifier,
        });


        if (this.data.selectedNodeId !== nodeId) {
            this.setSelectedNodeId(nodeId);
            this.setSelectedNodeIdentifier(Identifier);
            this.setSelectedNodeNamespaceIndex(NamespaceIndex);
            this.setSelectedNodeIdentifierType(IdentifierType);
        }
    };

    /* ------------------------- Image Handling Methods ------------------------- */

    /**
     * @method setImageOpcuaVariable
     * @iatStudioExposed
     * Sets an image for opcua variable.
     * @param {ImagePath} image
     */
    p.setImageOpcuaVariable = function (image, omitSettings) {
        this._setImageHelper(
            image || DEFAULT_IMAGES.variable,
            "variable",
            "imageOpcuaVariable",
            omitSettings
        );
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
        this._setImageHelper(
            image || DEFAULT_IMAGES.packageOpen,
            "object.expanded",
            "imageOpcuaPackageOpen",
            omitSettings
        );
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
        this._setImageHelper(
            image || DEFAULT_IMAGES.packageClose,
            "object.collapsed",
            "imageOpcuaPackageClose",
            omitSettings
        );
    };

    /**
     * @method getImageOpcuaPackageClose
     * Returns the path of the image for opcua package close.
     * @return {ImagePath} text
     */
    p.getImageOpcuaPackageClose = function () {
        return this.settings.imageOpcuaPackageClose;
    };

    /**
     * @method setImageOpcuaMethod
     * @iatStudioExposed
     * Sets an image for opcua method.
     * @param {ImagePath} image
     */
    p.setImageOpcuaMethod = function (image, omitSettings) {
        this._setImageHelper(
            image || DEFAULT_IMAGES.method,
            "method",
            "imageOpcuaMethod",
            omitSettings
        );
    };

    /**
     * @method getImageOpcuaMethod
     * Returns the path of the image for opcua method.
     * @return {ImagePath} text
     */
    p.getImageOpcuaMethod = function () {
        return this.settings.imageOpcuaMethod;
    };

    p._setImageHelper = function (image, iconClass, settingName, omitSettings) {
        _rejectImageDeferredIfPending.call(this);

        if (!omitSettings) {
            this.settings[settingName] = image;
        }

        const svgs = this.el.find(`svg.opcua-icon.opcua-${iconClass}`);
        const imgs = this.el.find(`img.opcua-icon.opcua-${iconClass}`);

        if (UtilsImage.isStylable(image) && this.settings.useSVGStyling) {
            this.imageDeferred = UtilsImage.getInlineSvg(image);
            this.imageDeferred.done((svgElement) => {
                svgs.each((i, el) => $(el).replaceWith(svgElement.clone()));
                svgs.show();
                imgs.hide();
                this._refreshScroller();
            });
        } else {
            imgs.attr("src", image);
            svgs.hide();
            imgs.show();
            this._refreshScroller();
        }
    };

    /* ------------------------- Other Public Methods ------------------------- */

    /**
     * @method getSelectedNodeId
     * Get selected node id in the tree
     * @return {String}
     */
    p.getSelectedNodeId = function () {
        return this.data.selectedNodeId;
    };

    /**
     * @method setSelectedNodeId
     * Set selected node id in the tree
     * @param {String} nodeId
     */
    p.setSelectedNodeId = function (nodeId) {
        this.data.selectedNodeId = nodeId;
        this.sendValueChange({ selectedNodeId: this.getSelectedNodeId() });
    }

    /**
     * @method getSelectedNodeIdentifier
     * Get selected node identifier in the tree
     * @return {String}
     */
    p.getSelectedNodeIdentifier = function () {
        return this.data.selectedNodeIdentifier;
    }

    /**
     * @method setSelectedNodeIdentifier
     * Set selected node identifier in the tree
     * @param {String} nodeIdentifier
     */
    p.setSelectedNodeIdentifier = function (nodeIdentifier) {
        this.data.selectedNodeIdentifier = nodeIdentifier;
        this.sendValueChange({ selectedNodeIdentifier: this.getSelectedNodeIdentifier() });
    }

    /**
     * @method getSelectedNodeNamespaceIndex
     * Get selected node namespace index in the tree
     * @return {Integer}
     */
    p.getSelectedNodeNamespaceIndex = function () {
        return this.data.selectedNodeNamespaceIndex;
    }

    /**
     * @method setSelectedNodeNamespaceIndex
     * Set selected node namespace index in the tree
     * @param {Integer} nodeNamespaceIndex
     */
    p.setSelectedNodeNamespaceIndex = function (nodeNamespaceIndex) {
        this.data.selectedNodeNamespaceIndex = nodeNamespaceIndex;
        this.sendValueChange({ selectedNodeNamespaceIndex: this.getSelectedNodeNamespaceIndex() });
    }

    /**
     * @method getSelectedNodeIdentifierType
     * Get selected node identifier type in the tree
     * @return {Integer}
     */
    p.getSelectedNodeIdentifierType = function () {
        return this.data.selectedNodeIdentifierType;
    }

    /**
     * @method setSelectedNodeIdentifierType
     * Set selected node identifier type in the tree
     * @param {Integer} nodeIdentifierType
     */
    p.setSelectedNodeIdentifierType = function (nodeIdentifierType) {
        this.data.selectedNodeIdentifierType = nodeIdentifierType;
        this.sendValueChange({ selectedNodeIdentifierType: this.getSelectedNodeIdentifierType() });
    }

    /**
     * @method setUseSVGStyling
     * Sets useSVGStyling
     * @param {Boolean} useSVGStyling
     */
    p.setUseSVGStyling = function (useSVGStyling) {
        this.settings.useSVGStyling = Types.parseValue(
            useSVGStyling,
            "Boolean",
            { default: true }
        );
        this.setImageOpcuaMethod(this.settings.imageOpcuaMethod, false);
        this.setImageOpcuaPackageClose(
            this.settings.imageOpcuaPackageClose,
            false
        );
        this.setImageOpcuaPackageOpen(
            this.settings.imageOpcuaPackageOpen,
            false
        );
        this.setImageOpcuaVariable(this.settings.imageOpcuaVariable, false);
        this._refreshScroller();
    };

    /**
     * @method getUseSVGStyling
     * Returns useSVGStyling
     * @return {Boolean}
     */
    p.getUseSVGStyling = function () {
        return this.settings.useSVGStyling;
    };

    /* ------------------------- Private Helpers ------------------------- */

    function _rejectImageDeferredIfPending() {
        if (this.imageDeferred?.state() === "pending") {
            this.imageDeferred.reject();
        }
    }

    // Widget registration
    if (window.lib_br?.controller?.widgetRegistry) {
        lib_br.controller.widgetRegistry.define(
            "widgets.opcuacviewer.OpcUacBrowser",
            WidgetClass
        );
    }

    return WidgetClass;
});
