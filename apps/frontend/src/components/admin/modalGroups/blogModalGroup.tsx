import type { AdminDashboardBlogProps, AdminDashboardCommonProps, AdminModalMap } from '../adminModalTypes';
import { BlogFormModal } from '../modals';

export function createBlogModalGroup({
  common,
  blog,
}: {
  common: AdminDashboardCommonProps;
  blog: AdminDashboardBlogProps;
}): AdminModalMap {
  return {
    blog: (
      <BlogFormModal
        editingBlogId={blog.editingId}
        busy={common.busy}
        initialValues={blog.form}
        uploadingField={common.uploadingField}
        onUpload={common.uploadAsset}
        onSubmit={blog.submit}
        onClose={common.closeModal}
      />
    ),
  };
}
