import databaseService from "../services/database.service.js";

export interface Certificate {
  certificate_id: number;
  certificate_code: string;
  user_id: number;
  username: string;
  course_id: number;
  course_title: string;
  course_duration: number | null;
  lesson_count: number;
  enrollment_id: number | null;
  issued_at: Date;
  created_at: Date;
  updated_at: Date;
}

const formatCertificate = (row: any): Certificate => ({
  certificate_id: Number(row.certificate_id),
  certificate_code: row.certificate_code,
  user_id: Number(row.user_id),
  username: row.username,
  course_id: Number(row.course_id),
  course_title: row.course_title,
  course_duration: row.course_duration != null ? Number(row.course_duration) : null,
  lesson_count: row.lesson_count != null ? Number(row.lesson_count) : 0,
  enrollment_id: row.enrollment_id != null ? Number(row.enrollment_id) : null,
  issued_at: row.issued_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export class CertificateModel {
  async getOrCreateCertificate(userId: number, courseId: number, enrollmentId: number): Promise<Certificate> {
    const query = `
      WITH next_certificate AS (
        SELECT nextval(pg_get_serial_sequence('"Certificate"', 'certificate_id')) AS certificate_id
      ),
      upserted AS (
        INSERT INTO "Certificate" (
          certificate_id,
          certificate_code,
          user_id,
          course_id,
          enrollment_id,
          issued_at,
          created_at,
          updated_at
        )
        SELECT
          next_certificate.certificate_id,
          'JPM-' || $2::int || '-' || $1::int || '-' || LPAD(next_certificate.certificate_id::text, 6, '0'),
          $1,
          $2,
          $3,
          NOW(),
          NOW(),
          NOW()
        FROM next_certificate
        ON CONFLICT (user_id, course_id)
        DO UPDATE SET
          enrollment_id = COALESCE("Certificate".enrollment_id, EXCLUDED.enrollment_id),
          updated_at = NOW()
        RETURNING certificate_id, certificate_code, user_id, course_id, enrollment_id, issued_at, created_at, updated_at
      )
      SELECT
        upserted.certificate_id,
        upserted.certificate_code,
        upserted.user_id,
        u.username,
        upserted.course_id,
        co.title AS course_title,
        co.duration AS course_duration,
        COUNT(l.lesson_id)::int AS lesson_count,
        upserted.enrollment_id,
        upserted.issued_at,
        upserted.created_at,
        upserted.updated_at
      FROM upserted
      JOIN "User" u ON u.user_id = upserted.user_id
      JOIN "Course" co ON co.course_id = upserted.course_id
      LEFT JOIN "Lesson" l ON l.course_id = co.course_id
      GROUP BY upserted.certificate_id, upserted.certificate_code, upserted.user_id, u.username,
        upserted.course_id, co.title, co.duration, upserted.enrollment_id, upserted.issued_at,
        upserted.created_at, upserted.updated_at;
    `;

    const result = await databaseService.executeQuery(query, [userId, courseId, enrollmentId]);
    if (!result.rows[0]) {
      throw new Error("Failed to get or create certificate");
    }
    return formatCertificate(result.rows[0]);
  }

  async getCertificateByCourse(userId: number, courseId: number): Promise<Certificate | null> {
    const query = `
      SELECT
        cert.certificate_id,
        cert.certificate_code,
        cert.user_id,
        u.username,
        cert.course_id,
        co.title AS course_title,
        co.duration AS course_duration,
        COUNT(l.lesson_id)::int AS lesson_count,
        cert.enrollment_id,
        cert.issued_at,
        cert.created_at,
        cert.updated_at
      FROM "Certificate" cert
      JOIN "User" u ON u.user_id = cert.user_id
      JOIN "Course" co ON co.course_id = cert.course_id
      LEFT JOIN "Lesson" l ON l.course_id = co.course_id
      WHERE cert.user_id = $1 AND cert.course_id = $2
      GROUP BY cert.certificate_id, cert.certificate_code, cert.user_id, u.username,
        cert.course_id, co.title, co.duration, cert.enrollment_id, cert.issued_at,
        cert.created_at, cert.updated_at;
    `;

    const result = await databaseService.executeQuery(query, [userId, courseId]);
    return result.rows[0] ? formatCertificate(result.rows[0]) : null;
  }
}

export default new CertificateModel();
