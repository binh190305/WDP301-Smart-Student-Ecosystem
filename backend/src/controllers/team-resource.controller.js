const AppError = require('../utils/app-error');
const asyncHandler = require('../utils/async-handler');
const teamResourceService = require('../services/team-resource.service');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Vui lòng chọn tệp để tải lên', 400);
  const resource = await teamResourceService.addFileResource(req.params.id, req.user.id, req.file, req.body.title);
  res.status(201).json({ success: true, data: { resource } });
});

const addLink = asyncHandler(async (req, res) => {
  const resource = await teamResourceService.addLinkResource(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data: { resource } });
});

const listResources = asyncHandler(async (req, res) => {
  const resources = await teamResourceService.listResources(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: { resources } });
});

const deleteResource = asyncHandler(async (req, res) => {
  await teamResourceService.deleteResource(req.params.id, req.params.resourceId, req.user);
  res.status(204).send();
});

const downloadFile = asyncHandler(async (req, res) => {
  const { filePath, fileName, mimeType } = await teamResourceService.getFile(
    req.params.id,
    req.params.resourceId,
    req.user.id
  );
  res.type(mimeType).download(filePath, fileName);
});

module.exports = { uploadFile, addLink, listResources, deleteResource, downloadFile };
