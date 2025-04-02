🌟 **OpcUacBrowser** 🌟

The `OpcUacBrowser` is a widget designed to simplify the browsing and interaction with OPC UA servers. It provides an intuitive interface for developers and users to explore OPC UA nodes efficiently.

---

## ✨ Features

- 🖥️ **User-friendly Interface**: Navigate OPC UA nodes with ease.
- 🎨 **Customizable**: Adapt the widget to your specific needs.

---

## 📦 Installation

For installation instructions, refer to the [INSTALL.md](INSTALL.md) file.

---

## 🤝 Contribution

We welcome contributions to improve the `OpcUacBrowser` widget! To contribute:

1. Fork the repository and create a new branch for your feature or bug fix.
2. Make your changes, ensuring they align with the project's coding standards.
3. Write tests for your changes, if applicable.
4. Submit a pull request with a clear description of your changes.

For more details, refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

--- 

## ✅ Tested Versions

The `OpcUacBrowser` widget has been tested with the following versions:

- **Automation Studio**: `V6.1.1.14`
- **mappView**: `V6.1.1`
- **mappService**: `V6.1.0`
- **OPC UA C/S**: `V6.0.0`
- **Automation Runtime**: `V6.1.0`

---

## ⚙️ Properties

### 📋 Properties

The `OpcUacBrowser` widget exposes the following properties, as defined in `OpcUacBrowser.xsd`:

| **Name**                  | **Type**              | **Description**                                                                                          | **Bindable** | **Necessary** | **Default Value** |
|---------------------------|-----------------------|----------------------------------------------------------------------------------------------------------|--------------|---------------|-------------------|
| `width`                  | `Size`               | Outer width of the widget.                                                                              | ❌           | No            | `100`             |
| `height`                 | `Size`               | Outer height of the widget.                                                                             | ❌           | No            | `30`              |
| `selectedNodeId`         | `String`             | Actual selected nodeId in the tree (e.g., `NS0\|Numeric\|85`).<br>Represents the unique identifier of the selected node. | ✅          | No            | `''`              |
| `selectedNodeIdentifier` | `String`             | Actual selected nodeIdentifier in the tree (e.g., `85`).                                                | ✅          | No            | `''`              |
| `selectedNodeNamespaceIndex` | `Integer`        | Actual selected nodeNamespaceIndex in the tree (e.g., `0`).                                             | ✅          | No            | `0`               |
| `selectedNodeIdentifierType` | `Integer`        | Actual selected nodeIdentifierType in the tree (e.g., `0=Numeric, 1=String, 2=Guid, 3=Opaque`).         | ✅          | No            | `0`               |
| `serverAlias` | `String`        | Server alias of the server opcua you want to explore (Defined in the OpcUaServer.uaserver file)         | ❌          | ✅            | `''`               |

---

### 🎨 Stylable Properties

The `OpcUacBrowser` widget exposes the following styling properties, as defined in `OpcUacBrowser.style`:

| **Name**                  | **Type**              | **Description**                                                                                          | **Default Value** |
|---------------------------|-----------------------|----------------------------------------------------------------------------------------------------------|-------------------|
| `backColor`              | `Color`              | Background color of the widget.                                                                         | `#FFDEAA`         |
| `fontSize`               | `PixelVal`           | Font size of the text in pixels.                                                                        | `12px`            |
| `fontName`               | `FontName`           | Font name of the text.                                                                                   | `Arial`           |
| `textColor`              | `Color`              | Color of the text.                                                                                       | `#000000`         |
| `bold`                   | `Boolean`            | If `true`, the font style is bold.                                                                      | `false`           |
| `italic`                 | `Boolean`            | If `true`, the font style is italic.                                                                    | `false`           |
| `borderStyle`            | `BorderStyle`        | Style of the widget's border.                                                                           | `solid`           |
| `borderWidth`            | `PixelValCollection` | Width of the widget's border.                                                                           | `2px`             |
| `borderColor`            | `ColorCollection`    | Color of the widget's border.                                                                           | `#5B7C70`         |
| `selectedBackColor`      | `Color`              | Background color of the selected node.                                                                  | `#0078D7`         |
| `selectedTextColor`      | `Color`              | Text color of the selected node.                                                                        | `#FFFFFF`         |
| `hoverBackColor`         | `Color`              | Background color when hovering over a node.                                                             | `#E5F1FB`         |

---

## 🛠️ Actions and Events

### 🚀 Actions

The `OpcUacBrowser` widget supports the following actions:

| **Name**                     | **Description**                                                                 | **Arguments**                                                                 |
|------------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `SetVisible`                | Controls the visibility of the widget.                                          | `value`: `Boolean`                                                           |
| `SetEnable`                 | Controls the usability of the widget.                                           | `value`: `Boolean`                                                           |
| `SetStyle`                  | Applies a predefined style to the widget.                                       | `value`: `StyleReference`                                                    |
| `SetImageOpcuaMethod`       | Sets an image for an OPC UA method.                                             | `image`: `ImagePath`                                                         |
| `SetImageOpcuaPackageClose` | Sets an image for a closed OPC UA package.                                      | `image`: `ImagePath`                                                         |
| `SetImageOpcuaPackageOpen`  | Sets an image for an open OPC UA package.                                       | `image`: `ImagePath`                                                         |
| `SetImageOpcuaVariable`     | Sets an image for an OPC UA variable.                                           | `image`: `ImagePath`                                                         |
| `ShowTooltip`               | Enables tooltip mode for the widget.                                           | None                                                                         |
| `Focus`                     | Sets the focus to the widget when keyboard operation is enabled.                | None                                                                         |

---

### 📡 Events

The `OpcUacBrowser` widget supports the following events:

| **Name**           | **Description**                                                                 | **Arguments**                                                                 |
|--------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `Click`           | Triggered when the widget is clicked.                                           | None                                                                         |
| `DisabledClick`   | Triggered when the disabled widget is clicked.                                  | None                                                                         |
| `EnableChanged`   | Triggered when the usability of the widget is modified.                         | `value`: `Boolean`                                                           |
| `VisibleChanged`  | Triggered when the visibility of the widget is modified.                        | `value`: `Boolean`                                                           |
| `FocusIn`         | Triggered when the widget gets the focus.                                       | None                                                                         |
| `FocusOut`        | Triggered when the widget loses the focus.                                      | None                                                                         |
| `NodeClicked`     | Fired when a node in the OPC UA tree is clicked.                                | `NodeId`: `String` - Node Id of the clicked node (e.g., NS0\|Numeric\|85).<br>`NamespaceIndex`: `Integer` - Namespace index of the clicked node (e.g., 0).<br>`IdentifierType`: `Integer` - Identifier type of the clicked node, based on UAIdentifierType enum (Numeric=0, String=1, Guid=2, Opaque=3).<br>`Identifier`: `String` - Identifier of the clicked node (e.g., 85). |

---
