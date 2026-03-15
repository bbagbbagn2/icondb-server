/**
 * Supabase 스토리지 유틸리티
 * @description 파일 업로드/다운로드 관리
 */

const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");

/**
 * 파일을 Supabase 스토리지에 업로드
 * @param {Buffer} file_buffer - 파일 버퍼
 * @param {String} bucket_name - 버킷 이름
 * @param {String} folder_path - 폴더 경로
 * @returns {Promise<String>} 업로드된 파일 경로
 */
const upload_file_to_storage = async (
  file_buffer,
  bucket_name,
  folder_path = "",
) => {
  try {
    const file_name = `${uuidv4()}.png`;
    const file_path = folder_path ? `${folder_path}/${file_name}` : file_name;

    const { data, error } = await supabase.storage
      .from(bucket_name)
      .upload(file_path, file_buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) throw error;

    return file_path;
  } catch (error) {
    console.error("[Storage Upload Error]", error);
    throw error;
  }
};

/**
 * Supabase 스토리지에서 파일 조회
 * @param {String} bucket_name - 버킷 이름
 * @param {String} file_path - 파일 경로
 * @returns {Promise<Buffer>} 파일 버퍼
 */
const get_file_from_storage = async (bucket_name, file_path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket_name)
      .download(file_path);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("[Storage Download Error]", error);
    throw error;
  }
};

/**
 * SVG 파일을 스토리지에 업로드
 * @param {Buffer} svg_buffer - SVG 파일 버퍼
 * @returns {Promise<String>} 저장된 파일 경로
 */
const upload_svg_to_storage = async (svg_buffer) => {
  try {
    const file_name = `${uuidv4()}.svg`;

    const { data, error } = await supabase.storage
      .from("svg")
      .upload(file_name, svg_buffer, {
        contentType: "image/svg+xml",
        upsert: false,
      });

    if (error) throw error;

    return file_name;
  } catch (error) {
    console.error("[SVG Upload Error]", error);
    throw error;
  }
};

/**
 * SVG 파일을 스토리지에서 조회
 * @param {String} file_key - 파일 키 (확장자 제외)
 * @returns {Promise<Buffer>} SVG 파일 버퍼
 */
const get_svg_from_storage = async (file_key) => {
  try {
    const file_path = `${file_key}.svg`;

    const { data, error } = await supabase.storage
      .from("svg")
      .download(file_path);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("[SVG Download Error]", error);
    throw error;
  }
};

module.exports = {
  upload_file_to_storage,
  get_file_from_storage,
  upload_svg_to_storage,
  get_svg_from_storage,
};
