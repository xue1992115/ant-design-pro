import RenderAuthorized from '@/components/Authorized';
import { getAuthority } from './authority';

let Authorized = RenderAuthorized(getAuthority()); // eslint-disable-line
// 加载有权限的组件
// Reload the rights component
const reloadAuthorized = () => {
  Authorized = RenderAuthorized(getAuthority());
};

export { reloadAuthorized };
export default Authorized;
