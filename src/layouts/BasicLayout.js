
import React, { Suspense } from 'react';
import { Layout } from 'antd';
// 根据不同的路由，改变文档的title
import DocumentTitle from 'react-document-title';
import isEqual from 'lodash/isEqual';
//  memoize-one 使用闭包缓存数据
import memoizeOne from 'memoize-one';
// TODO
import { connect } from 'dva';
// 媒体查询，响应式组件
import { ContainerQuery } from 'react-container-query';
//  动态传入css
import classNames from 'classnames';
// 匹配路径参数
import pathToRegexp from 'path-to-regexp';
//  媒体查询组件
import Media from 'react-media';
import { formatMessage } from 'umi/locale';
import Authorized from '@/utils/Authorized';
import logo from '../assets/logo.svg';
import Footer from './Footer';
import Header from './Header';
import Context from './MenuContext';
import Exception403 from '../pages/Exception/403';
import PageLoading from '@/components/PageLoading';
import SiderMenu from '@/components/SiderMenu';

import styles from './BasicLayout.less';


/* 
全局的布局
 */
// lazy load SettingDrawer 延迟加载SettingDrawer组件
const SettingDrawer = React.lazy(() => import('@/components/SettingDrawer'));

const { Content } = Layout;
//  设置设备的屏幕的最小值和最大值
const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
    maxWidth: 1599,
  },
  'screen-xxl': {
    minWidth: 1600,
  },
};
/* 
PureComponent，重写了react的生命周期的方法shouldComponentUpdate，对props或者state进行了浅比较（浅复制比较），从而决定是否更新组件。
（1） 引用和第一层数据都没发生改变， render 方法就不会触发，这是我们需要达到的效果。 
存在以下两个问题：
（2）虽然第一层数据没变，但引用变了，就会造成虚拟 DOM 计算的浪费。
（3）第一层数据变了，但是引用没有变，会造成不渲染，所以要很小心的操作数据
解决方案：
（1）易变数据不能使用同一引用
（2）不变数据使用一个引用
*/
class BasicLayout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.matchParamsPath = memoizeOne(this.matchParamsPath, isEqual);
  }

  componentDidMount() {
    const {
      dispatch,
      route: { routes, authority },
    } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
    });
    dispatch({
      type: 'setting/getSetting',
    });
    dispatch({
      type: 'menu/getMenuData',
      payload: { routes, authority },
    });
  }

  componentDidUpdate(preProps) {
    // After changing to phone mode,
    // if collapsed is true, you need to click twice to display
    const { collapsed, isMobile } = this.props;
    if (isMobile && !preProps.isMobile && !collapsed) {
      this.handleMenuCollapse(false);
    }
  }
//  获取上下文

  getContext() {
    const { location, breadcrumbNameMap } = this.props;
    return {
      location,
      breadcrumbNameMap,
    };
  }
  // 匹配路径参数

  matchParamsPath = (pathname, breadcrumbNameMap) => {
    const pathKey = Object.keys(breadcrumbNameMap).find(key => pathToRegexp(key).test(pathname));
    return breadcrumbNameMap[pathKey];
  };
// 获取路由权限 

  getRouterAuthority = (pathname, routeData) => {
    let routeAuthority = ['noAuthority'];
    const getAuthority = (key, routes) => {
      routes.map(route => {
        if (route.path && pathToRegexp(route.path).test(key)) {
          routeAuthority = route.authority;
        } else if (route.routes) {
          routeAuthority = getAuthority(key, route.routes);
        }
        return route;
      });
      return routeAuthority;
    };
    return getAuthority(pathname, routeData);
  };
// 获取页面的title

  getPageTitle = (pathname, breadcrumbNameMap) => {
    const currRouterData = this.matchParamsPath(pathname, breadcrumbNameMap);

    if (!currRouterData) {
      return 'Ant Design Pro';
    }
    const pageName = formatMessage({
      id: currRouterData.locale || currRouterData.name,
      defaultMessage: currRouterData.name,
    });

    return `${pageName} - Ant Design Pro`;
  };
// 获取布局样式

  getLayoutStyle = () => {
    const { fixSiderbar, isMobile, collapsed, layout } = this.props;
    if (fixSiderbar && layout !== 'topmenu' && !isMobile) {
      return {
        paddingLeft: collapsed ? '80px' : '256px',
      };
    }
    return null;
  };
  // 处理菜单折叠

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };

  renderSettingDrawer = () => {
    // Do not render SettingDrawer in production
    // unless it is deployed in preview.pro.ant.design as demo
    if (process.env.NODE_ENV === 'production' && APP_TYPE !== 'site') {
      return null;
    }
    return <SettingDrawer />;
  };

  render() {
    const {
      navTheme,  // 导航主题
      layout: PropsLayout, 
      children,
      location: { pathname },
      isMobile, // 是否是移动界面
      menuData, // 菜单数据
      breadcrumbNameMap, // 面包屑
      route: { routes }, // 路由
      fixedHeader,
    } = this.props;
    const isTop = PropsLayout === 'topmenu';
    const routerConfig = this.getRouterAuthority(pathname, routes);
    const contentStyle = !fixedHeader ? { paddingTop: 0 } : {};
    const layout = (
      <Layout>
        {!isTop && isMobile  ? null : (
          <SiderMenu
            logo={logo}
            theme={navTheme}
            onCollapse={this.handleMenuCollapse}
            menuData={menuData}
            isMobile={isMobile}
            {...this.props}
          />
        )}
        <Layout
          style={{
            ...this.getLayoutStyle(),
            minHeight: '100vh',
          }}
        >
          <Header
            menuData={menuData}
            handleMenuCollapse={this.handleMenuCollapse}
            logo={logo}
            isMobile={isMobile}
            {...this.props}
          />
          <Content className={styles.content} style={contentStyle}>
            {children}
          </Content>
          <Footer />
        </Layout>
      </Layout>
    );
    return (
      <React.Fragment>
        <DocumentTitle title={this.getPageTitle(pathname, breadcrumbNameMap)}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        <Suspense fallback={<PageLoading />}>{this.renderSettingDrawer()}</Suspense>
      </React.Fragment>
    );
  }
}

export default connect(({ global, setting, menu }) => ({
  collapsed: global.collapsed,
  layout: setting.layout,
  menuData: menu.menuData,
  breadcrumbNameMap: menu.breadcrumbNameMap,
  ...setting,
}))(props => (
  <Media query="(max-width: 599px)">
    {isMobile => <BasicLayout {...props} isMobile={isMobile} />}
  </Media>
));
// react中新添加的特性，
/* 
（1）React.memo(),用于包装组件， only rerenders if props change
（2）React.lazy(),对代码拆分，延迟加载
（3）contextType(),获取组件的上下文
*/
//  React.Fragment
/* 
聚合子元素的列表，不需要添加其他的标签
*/


// Context.Provider
/* 
通过createContext(),创建一个Provider，Consumer。
Provider的作用接收一个 value 属性传递给 Provider 的后代 Consumers。一个 Provider 可以联系到多个 Consumers。Providers 可以被嵌套以覆盖组件树内更深层次的值。
Consumer一个可以订阅 context 变化的 React 组件。
*/

// dva的connect方法和connected方法
/* 
（1）connect是容器组件，是在原始的组件外包装一层State，将state映射到props上，connect接受一个函数，返回一个函数
（2）@connect只是connection的装饰器和语法糖，export的不再是connect,而是组件本身，@connect必须放在export default class前面
*/