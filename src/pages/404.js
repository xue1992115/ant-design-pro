import React from 'react';
import Link from 'umi/link';
import { formatMessage } from 'umi/locale';
import Exception from '@/components/Exception';

export default () => (
  <Exception
    type="404"
    linkElement={Link}
    desc={formatMessage({ id: 'app.exception.description.404' })}
    backText={formatMessage({ id: 'app.exception.back' })}
  />
);
/* 
注意开发模式下有内置的umi提供的404提示页面，所以只有显示访问/404，才能访问到这个页面。
*/