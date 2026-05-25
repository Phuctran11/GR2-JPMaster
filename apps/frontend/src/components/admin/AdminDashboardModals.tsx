import { AdminModalRouter } from './AdminModalRouter';
import {
  createBlogModalGroup,
  createCourseLessonModalGroup,
  createJlptModalGroup,
  createQuestionModalGroup,
  createUserModalGroup,
} from './AdminDashboardModalGroups';
import type {
  AdminDashboardBlogProps,
  AdminDashboardCommonProps,
  AdminDashboardCourseLessonProps,
  AdminDashboardJlptProps,
  AdminDashboardQuestionProps,
  AdminDashboardTestProps,
  AdminDashboardUserProps,
} from './adminModalTypes';

export function AdminDashboardModals({
  common,
  users,
  courseLessons,
  tests,
  jlpt,
  questions,
  blog,
}: {
  common: AdminDashboardCommonProps;
  users: AdminDashboardUserProps;
  courseLessons: AdminDashboardCourseLessonProps;
  tests: AdminDashboardTestProps;
  jlpt: AdminDashboardJlptProps;
  questions: AdminDashboardQuestionProps;
  blog: AdminDashboardBlogProps;
}) {
  return (
    <AdminModalRouter
      activeModal={common.activeModal}
      modals={{
        ...createUserModalGroup({ common, users }),
        ...createCourseLessonModalGroup({ common, courseLessons, tests }),
        ...createJlptModalGroup({ common, jlpt, questions }),
        ...createQuestionModalGroup({ common, jlpt, questions }),
        ...createBlogModalGroup({ common, blog }),
      }}
    />
  );
}
