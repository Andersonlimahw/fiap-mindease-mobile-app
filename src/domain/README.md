# Domain Layer

The `domain` layer is the heart of the application. It contains the business logic and the domain entities, and it is completely independent of the other layers of the application.

This layer defines the application's core concepts and rules. It is not concerned with implementation details such as the database or the user interface.

## Entities

The `entities` directory contains the domain entities of the application. An entity is an object that has a unique identity and is not defined by its attributes.

### Entity List

- **`AuthProvider`:** Defines the available authentication providers.
- **`Task`:** Represents a productivity task with priorities, subtasks, and completion metadata.
- **`PomodoroSession`:** Logs the history of Pomodoro timers (focus/break cycles).
- **`FocusSession`:** Captures distraction-free sessions with sound settings and durations.
- **`ChatMessage`:** Stores messages exchanged with the AI assistant.
- **`ContentItem`:** Represents curated reading content (title, summary, body).
- **`File`:** Describes uploaded attachments tied to a user + logical record (e.g., task note).
- **`User`:** Represents a MindEase user and profile preferences.

## Repositories

The `repositories` directory contains the interfaces for the repositories. A repository is a collection-like interface that is used to access the domain entities.

The repository interfaces are defined in the `domain` layer, but their implementations are in the `data` layer. This is an example of the Dependency Inversion Principle, which states that high-level modules should not depend on low-level modules, but both should depend on abstractions.

### Mermaid Diagram: Entity Relationship

Here is a diagram that illustrates the relationship between the main entities:

```mermaid
erDiagram
    USER ||--o{ TASK : has
    USER ||--o{ POMODOROSESSION : has
    USER ||--o{ FOCUSSESSION : has
    USER ||--o{ CHATMESSAGE : has
    USER ||--o{ CONTENTITEM : bookmarks
    USER ||--o{ FILE : uploads

    TASK {
        string id
        string userId
        string title
        string description
        string priority
        bool completed
        number createdAt
    }

    POMODOROSESSION {
        string id
        string userId
        number duration
        string phase
        number completedAt
    }

    FOCUSSESSION {
        string id
        string userId
        number duration
        string ambientSound
        number startedAt
    }

    FILE {
        string id
        string userId
        string recordId
        string downloadUrl
        string mimeType
        number createdAt
    }
```
