import { contextBridge, ipcRenderer } from 'electron';
import type { AiEvent, FrentyApi, RenderEvent, UpdateEvent } from './api';

const call =
  (ch: string) =>
  (...args: unknown[]) =>
    ipcRenderer.invoke(ch, ...args);

const api: FrentyApi = {
  list: call('list'),
  create: call('create'),
  importMarkdown: call('importMarkdown'),
  get: call('get'),
  save: call('save'),
  rename: call('rename'),
  duplicate: call('duplicate'),
  remove: call('remove'),
  parse: call('parse'),
  aiCompose: call('aiCompose'),
  aiCancel: call('aiCancel'),
  onAi: (cb) => {
    const fn = (_: unknown, e: AiEvent) => cb(e);
    ipcRenderer.on('ai:event', fn);
    return () => ipcRenderer.removeListener('ai:event', fn);
  },
  aiSettings: call('aiSettings'),
  setAiSettings: call('setAiSettings'),
  voiceSettings: call('voiceSettings'),
  setVoiceSettings: call('setVoiceSettings'),
  listVoices: call('listVoices'),
  openExternal: call('openExternal'),
  updateInfo: call('updateInfo'),
  checkUpdate: call('checkUpdate'),
  installUpdate: call('installUpdate'),
  onUpdate: (cb) => {
    const fn = (_: unknown, e: UpdateEvent) => cb(e);
    ipcRenderer.on('update:event', fn);
    return () => ipcRenderer.removeListener('update:event', fn);
  },
  render: call('render'),
  cancelRender: call('cancelRender'),
  onRender: (cb) => {
    const fn = (_: unknown, e: RenderEvent) => cb(e);
    ipcRenderer.on('render:event', fn);
    return () => ipcRenderer.removeListener('render:event', fn);
  },
  openVideo: call('openVideo'),
  showInFolder: call('showInFolder'),
  exportVideo: call('exportVideo'),
  exportMarkdown: call('exportMarkdown'),
  brands: call('brands'),
  saveBrand: call('saveBrand'),
  createBrand: call('createBrand'),
  removeBrand: call('removeBrand'),
  setDefaultBrand: call('setDefaultBrand'),
  resetBrand: call('resetBrand'),
  importBrand: call('importBrand'),
  exportBrand: call('exportBrand'),
  pickLogo: call('pickLogo'),
  libraryPath: call('libraryPath'),
  chooseLibrary: call('chooseLibrary'),
  openLibrary: call('openLibrary'),
} as FrentyApi;

contextBridge.exposeInMainWorld('frenty', api);
