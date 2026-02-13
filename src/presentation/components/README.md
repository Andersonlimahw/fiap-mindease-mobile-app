# Components

The `components` directory contains reusable UI components that are used throughout the application. These components are designed to be generic and customizable, so they can be adapted to different contexts.

By creating a library of reusable components, we can ensure a consistent look and feel across the application, and we can speed up the development process by reusing code.

## Component List

- **`Avatar`:** Displays a user's avatar or a default image.
- **`BrandLogo`:** Displays the application's logo.
- **`BrandSelector`:** Allows switching between MindEase and Neon palettes.
- **`Button`:** A customizable button component.
- **`FileUploader`:** Handles file selection/upload in staged or bound mode.
- **`EmptyStateBanner`:** A banner shown when there is no data to present.
- **`Input`:** A customizable text input component.
- **`QuickAction`:** A button with an icon and a label for the Home shortcuts.
- **`Skeleton`:** A component that displays a placeholder loading animation.
- **`SwipeableRow`:** A row that can be swiped to reveal actions.
- **`TaskItem`:** Displays a task row with priority indicators.
- **`charts/HorizontalBarChart`:** A horizontal bar chart.

### Mermaid Diagram: Component Hierarchy

Here is a diagram that illustrates the component hierarchy:

```mermaid
graph TD
    A[Screen] --> B(Container)
    B --> C{Avatar}
    B --> D{Button}
    B --> E{FileUploader}
    B --> F{Input}
    B --> G{TaskItem}
    G --> H{SwipeableRow}
```
