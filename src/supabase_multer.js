/**
 * Supabase Storage + Multer 설정
 * AWS S3 대신 Supabase Storage 사용
 * 배포가 간편하고 프론트엔드 개발자가 관리하기 쉬움
 */

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const supabase = require("./supabase");
const dotenv = require("dotenv");

dotenv.config();

const BUCKET_NAME = process.env.SUPABASE_BUCKET || "icondb";

/**
 * 메모리 스토리지 → Supabase 업로드
 */
const storage = multer.memoryStorage();

/**
 * 파일 필터: 이미지/SVG만 허용
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/gif",
    "application/octet-stream",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

/**
 * 아이콘 업로드 설정
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1000 * 1000 }, // 10MB
});

/**
 * 프로필 이미지 업로드 설정
 */
const profile_upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1000 * 1000 }, // 5MB
});

/**
 * Supabase에 파일 업로드
 * @param {Buffer} fileBuffer - 파일 버퍼
 * @param {string} bucket - 버킷 이름 (img or userprofile)
 * @returns {Promise<string>} - 파일 경로
 */
const uploadToSupabase = async (fileBuffer, bucket) => {
  try {
    const fileName = `${Date.now()}_${uuidv4()}${path.extname("file.svg")}`;
    const filePath = `${bucket}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    return fileName;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * Supabase에서 파일 다운로드
 */
const download = async (req, res, key) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`img/${key}`);

    if (error) {
      return res.status(404).json({ error: "File not found" });
    }

    res.attachment(key);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed" });
  }
};

/**
 * SVG XML 처리
 */
const svg = async (req, res, key) => {
  try {
    const convert = require("xml-js");

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`img/${key}`);

    if (error) {
      return res.status(404).json({ error: "File not found" });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const xmlString = buffer.toString("utf-8");

    let l1 = convert.xml2json(xmlString, { compact: true, spaces: 4 });
    let l2 = convert.json2xml(l1, { compact: true, spaces: 4 });

    res.header("Access-Control-Allow-Origin", "*");
    res.send({ xml: l2 });
  } catch (error) {
    console.error("SVG processing error:", error);
    res.status(500).json({ error: "SVG processing failed" });
  }
};

module.exports = {
  upload: upload,
  download: download,
  svg: svg,
  profile_upload: profile_upload,
  uploadToSupabase: uploadToSupabase,
};
