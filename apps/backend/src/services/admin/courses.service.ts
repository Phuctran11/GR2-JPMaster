import { COURSE_LEVELS } from "../../constants/admin.constants.js";
import adminCoursesModel from "../../models/admin/courses.model.js";
import { ApiError } from "../../utils/http.js";
import { BodyInput, isOneOf, optionalNumber, parseAdminPagination, parseSortOrder, QueryInput, requireString, toNumberOrNull } from "../../validators/admin/common.validator.js";

type ActorContext = {
  userId: number;
  role: string;
};

const parseCoursePrice = (value: unknown) => {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price) || price < 0) {
    throw new ApiError(400, "price must be a non-negative number");
  }
  return price;
};

export class AdminCoursesService {
  async listCourses(query: QueryInput, ownerId?: number) {
    const { limit, offset } = parseAdminPagination(query);
    const params = {
      limit,
      offset,
      search: String(query.search || ""),
      level: String(query.level || ""),
      sortOrder: parseSortOrder(query.sort_order),
      ownerId,
    };
    const [data, totalCount] = await Promise.all([
      adminCoursesModel.listCourses(params),
      adminCoursesModel.countCourses(params),
    ]);

    return { data, totalCount };
  }

  async createCourse(body: BodyInput, actor: ActorContext) {
    const title = requireString(body.title);
    const price = parseCoursePrice(body.price);

    if (!title) {
      throw new ApiError(400, "title and a non-negative price are required");
    }

    if (!isOneOf(body.level, COURSE_LEVELS)) {
      throw new ApiError(400, "valid course level is required");
    }

    return adminCoursesModel.createCourse({
      title,
      description: requireString(body.description) || null,
      price,
      level: body.level,
      duration: toNumberOrNull(body.duration),
      cover_asset_id: toNumberOrNull(body.cover_asset_id),
      image_url: requireString(body.image_url) || null,
      created_by: actor.role === "admin" ? Number(body.created_by) || actor.userId : actor.userId,
    });
  }

  async updateCourse(courseId: number, body: BodyInput, ownerId?: number) {
    if (body.level !== undefined && !isOneOf(body.level, COURSE_LEVELS)) {
      throw new ApiError(400, "valid course level is required");
    }

    const price = body.price === undefined ? undefined : parseCoursePrice(body.price);

    const data = await adminCoursesModel.updateCourse(courseId, {
      title: body.title === undefined ? undefined : requireString(body.title),
      description: body.description === undefined ? undefined : requireString(body.description) || null,
      price,
      level: body.level === undefined ? undefined : body.level,
      duration: body.duration === undefined ? undefined : toNumberOrNull(body.duration),
      cover_asset_id: optionalNumber(body.cover_asset_id),
      image_url: body.image_url === undefined ? undefined : requireString(body.image_url) || null,
    }, ownerId);

    if (!data) {
      throw new ApiError(404, "Course not found or no changes provided");
    }

    return data;
  }

  async deleteCourse(courseId: number, ownerId?: number) {
    const deleted = await adminCoursesModel.deleteCourse(courseId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "Course not found");
    }
  }
}

export default new AdminCoursesService();
