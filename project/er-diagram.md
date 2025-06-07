# Journal App ER Diagram

```
+---------------+       +----------------+       +---------------+
|    Users      |       |    Journals    |       |  Attachments  |
+---------------+       +----------------+       +---------------+
| id (PK)       |       | id (PK)        |       | id (PK)       |
| username      |       | title          |       | journal_id (FK)|
| password      |       | description    |       | type          |
| role          |<----->| teacher_id (FK)|<----->| url           |
| created_at    |       | published_at   |       | filename      |
| updated_at    |       | is_published   |       | mime_type     |
+---------------+       | created_at     |       | size          |
        ^               | updated_at     |       | created_at    |
        |               +----------------+       | updated_at    |
        |                      ^                 +---------------+
        |                      |
        |                      |
        |               +------------------+
        +-------------->| journal_students |
                        +------------------+
                        | id (PK)          |
                        | journal_id (FK)  |
                        | student_id (FK)  |
                        | has_viewed_journal|
                        | notification_sent |
                        | created_at       |
                        | updated_at       |
                        +------------------+
```

## Entity Relationships

1. **Users** - Represents both teachers and students in the system
   - Primary Key: `id`
   - A user can be either a teacher or a student, determined by the `role` field

2. **Journals** - Represents journal entries created by teachers
   - Primary Key: `id`
   - Foreign Key: `teacher_id` references `Users.id`
   - Each journal is created by one teacher (One-to-Many relationship)
   - A journal can have a future `published_at` date, and `is_published` indicates if it should be visible to students

3. **Attachments** - Represents files attached to journals
   - Primary Key: `id`
   - Foreign Key: `journal_id` references `Journals.id`
   - Each attachment belongs to one journal (One-to-Many relationship)
   - Types include: image, video, url, pdf

4. **Journal Students** - Junction table for the Many-to-Many relationship between journals and students
   - Primary Key: `id`
   - Foreign Keys: `journal_id` references `Journals.id`, `student_id` references `Users.id`
   - Tracks whether a student has viewed a journal and if a notification has been sent

## Key Points

- Teachers can create, update, delete, and publish journals
- Students can view journals where they are tagged
- A journal can have multiple attachments of different types
- Future-dated journals are not visible to students until the published date

## Business Rules

1. Only teachers can create, update, delete, and publish journals
2. Students can only see journals where they are tagged and that are published
3. A journal with a future `published_at` date will not appear in a student's feed until that date
4. Teachers can see all journals they have created
5. When a student is tagged in a journal, they can potentially receive a notification