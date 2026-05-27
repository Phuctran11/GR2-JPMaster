import { adminAPI, type AdminBlog } from '../../services/api';
import { emptyBlog } from '../../components/admin/adminFormDefaults';
import type { AdminBlogFormValues } from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminBlogs({
  editingBlogId,
  setEditingBlogId,
  setBlogForm,
  setActiveModal,
  closeModal,
  run,
  loadBlogs,
  loadStats,
}: {
  editingBlogId: number | null;
  setEditingBlogId: (value: number | null) => void;
  setBlogForm: (values: AdminBlogFormValues) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadBlogs: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const openCreateBlog = () => {
    setEditingBlogId(null);
    setBlogForm(emptyBlog);
    setActiveModal('blog');
  };

  const openEditBlog = (item: AdminBlog) => {
    setEditingBlogId(item.blog_id);
    setBlogForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt || '',
      content: item.content || '',
      category: item.category || '',
      tags: item.tags?.map((tag) => tag.name).join(', ') || '',
      cover_asset_id: item.cover_asset_id ?? null,
      image_url: item.image_url || '',
      video_asset_id: item.video_asset_id ?? null,
      video_url: item.video_url || '',
      status: item.status,
    });
    setActiveModal('blog');
  };

  const deleteBlog = (item: AdminBlog) => {
    const confirmed = window.confirm(`Hide blog "${item.title}"?`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteBlog(item.blog_id);
      if (editingBlogId === item.blog_id) {
        setEditingBlogId(null);
        closeModal();
      }
      await Promise.all([loadBlogs(), loadStats()]);
    }, 'Blog hidden successfully');
  };

  const submitBlog = (values: AdminBlogFormValues) => {
    void run(async () => {
      const payload = {
        title: values.title,
        slug: values.slug || undefined,
        excerpt: values.excerpt || null,
        content: values.content || null,
        category_name: values.category || null,
        tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        cover_asset_id: values.cover_asset_id,
        image_url: values.image_url || null,
        video_asset_id: values.video_asset_id,
        video_url: values.video_url || null,
        status: values.status,
      };
      if (editingBlogId) await adminAPI.updateBlog(editingBlogId, payload);
      else {
        const created = await adminAPI.createBlog(payload);
        setEditingBlogId(created.data.blog_id);
      }
      await Promise.all([loadBlogs(), loadStats()]);
    }, editingBlogId ? 'Blog updated successfully' : 'Blog created successfully');
  };

  return { openCreateBlog, openEditBlog, deleteBlog, submitBlog };
}
