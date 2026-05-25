import lessonNoteReadModel from "./lessonNote.read.model.js";
import {
  LESSON_NOTE_TYPES,
  type CreateLessonNoteInput,
  type LessonNote,
  type LessonNoteFilters,
  type LessonNoteType,
  type UpdateLessonNoteInput,
} from "./lessonNote.types.js";
import lessonNoteWriteModel from "./lessonNote.write.model.js";

export { LESSON_NOTE_TYPES };
export type {
  CreateLessonNoteInput,
  LessonNote,
  LessonNoteFilters,
  LessonNoteType,
  UpdateLessonNoteInput,
};

export class LessonNoteModel {
  getUserNotes = lessonNoteReadModel.getUserNotes.bind(lessonNoteReadModel);
  countUserNotes = lessonNoteReadModel.countUserNotes.bind(lessonNoteReadModel);
  getUserNoteTypeCounts = lessonNoteReadModel.getUserNoteTypeCounts.bind(lessonNoteReadModel);
  getUserNoteById = lessonNoteReadModel.getUserNoteById.bind(lessonNoteReadModel);

  createNote = lessonNoteWriteModel.createNote.bind(lessonNoteWriteModel);
  updateNote = lessonNoteWriteModel.updateNote.bind(lessonNoteWriteModel);
  setPinned = lessonNoteWriteModel.setPinned.bind(lessonNoteWriteModel);
  softDeleteNote = lessonNoteWriteModel.softDeleteNote.bind(lessonNoteWriteModel);
}

export default new LessonNoteModel();

