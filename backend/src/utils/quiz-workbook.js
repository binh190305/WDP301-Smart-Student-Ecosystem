const ExcelJS = require('exceljs');
const AppError = require('./app-error');

const QUESTION_HEADERS = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF', 'correctAnswers'];
const OPTION_HEADERS = QUESTION_HEADERS.slice(1, 7);

const textValue = (value) => (value == null ? '' : String(value).trim());

const columnLabel = (index) => String.fromCharCode(65 + index);

const parseCorrectAnswers = (value, rowNumber, optionCount) => {
  const raw = textValue(value).toUpperCase();
  if (!raw) throw new AppError(`Dòng ${rowNumber}: thiếu correctAnswers`, 422);
  const tokens = raw.split(/[;,\s]+/).filter(Boolean);
  const indexes = [];
  for (const token of tokens) {
    if (!/^[A-F]$/.test(token)) {
      throw new AppError(`Dòng ${rowNumber}: correctAnswers chỉ nhận A-F`, 422);
    }
    const index = token.charCodeAt(0) - 65;
    if (index >= optionCount) {
      throw new AppError(`Dòng ${rowNumber}: đáp án ${token} không có lựa chọn tương ứng`, 422);
    }
    if (indexes.includes(index)) {
      throw new AppError(`Dòng ${rowNumber}: đáp án ${token} bị lặp`, 422);
    }
    indexes.push(index);
  }
  return indexes;
};

const parseQuestions = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet('Questions') || workbook.worksheets[0];
  if (!worksheet) throw new AppError('File Excel không có sheet Questions', 422);

  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values.slice(1).map(textValue);
  const missing = QUESTION_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new AppError(`Thiếu cột bắt buộc: ${missing.join(', ')}`, 422);

  const indexes = Object.fromEntries(QUESTION_HEADERS.map((header) => [header, headers.indexOf(header) + 1]));
  const questions = [];
  const errors = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = QUESTION_HEADERS.map((header) => textValue(row.getCell(indexes[header]).value));
    if (values.every((value) => !value)) return;
    const [questionText, ...optionValues] = values;
    const options = optionValues.slice(0, 6).filter(Boolean);
    try {
      if (questionText.length < 3 || questionText.length > 3000) {
        throw new Error('questionText phải có 3-3000 ký tự');
      }
      if (options.length < 2 || options.length > 6) throw new Error('Phải có 2-6 lựa chọn');
      if (options.some((option) => option.length > 2000)) throw new Error('Mỗi lựa chọn tối đa 2000 ký tự');
      questions.push({ questionText, options, correctIndexes: parseCorrectAnswers(values[7], rowNumber, options.length) });
    } catch (error) {
      errors.push(`Dòng ${rowNumber}: ${error.message}`);
    }
  });

  if (errors.length) throw new AppError('File Excel có dữ liệu chưa hợp lệ', 422, errors);
  if (!questions.length) throw new AppError('File Excel chưa có câu hỏi nào', 422);
  if (questions.length > 50) throw new AppError('Một bộ câu hỏi tối đa 50 câu', 422);
  return questions;
};

const createTemplateWorkbook = async (includeSamples = true) => {
  const workbook = new ExcelJS.Workbook();
  const instructions = workbook.addWorksheet('Instructions');
  instructions.columns = [{ header: 'Hướng dẫn', key: 'value', width: 100 }];
  [
    'Điền câu hỏi trong sheet Questions, mỗi dòng là một câu hỏi.',
    'questionText bắt buộc, mỗi câu có từ 2 đến 6 lựa chọn optionA đến optionF.',
    'correctAnswers dùng chữ cái lựa chọn: A hoặc A,C cho nhiều đáp án.',
    'Không xóa dòng tiêu đề và không để trống giữa các cột lựa chọn.',
  ].forEach((value) => instructions.addRow({ value }));
  instructions.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instructions.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2447D1' } };

  const questions = workbook.addWorksheet('Questions');
  questions.columns = QUESTION_HEADERS.map((header) => ({ header, key: header, width: header === 'questionText' ? 42 : 22 }));
  questions.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  questions.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2447D1' } };
  questions.views = [{ state: 'frozen', ySplit: 1 }];
  if (includeSamples) {
    questions.addRow({ questionText: 'Thủ đô của Việt Nam là gì?', optionA: 'Hà Nội', optionB: 'Đà Nẵng', optionC: 'Huế', optionD: 'Cần Thơ', correctAnswers: 'A' });
    questions.addRow({ questionText: 'Những số nào là số nguyên tố?', optionA: '2', optionB: '3', optionC: '4', optionD: '5', correctAnswers: 'A,B,D' });
  }
  return workbook;
};

module.exports = { parseQuestions, createTemplateWorkbook, QUESTION_HEADERS };
