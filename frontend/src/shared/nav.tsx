import { ReactNode } from 'react';
import {
  DashboardOutlined,
  BankOutlined,
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';

export interface NavItem {
  key: string;
  label: string;
  to?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

/**
 * 导航菜单配置
 * 
 * 除 dashboard 外其他项在 FE-0-72 任务中启用
 */
export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/',
    icon: <DashboardOutlined />,
    disabled: false,
  },
  {
    key: 'organizations',
    label: 'Organizations',
    to: '/organizations',
    icon: <BankOutlined />,
    disabled: true, // FE-0-72 启用
  },
  {
    key: 'properties',
    label: 'Properties',
    to: '/properties',
    icon: <HomeOutlined />,
    disabled: true, // FE-0-72 启用
  },
  {
    key: 'units',
    label: 'Units',
    to: '/units',
    icon: <AppstoreOutlined />,
    disabled: true, // FE-0-72 启用
  },
  {
    key: 'tenants',
    label: 'Tenants',
    to: '/tenants',
    icon: <UserOutlined />,
    disabled: true, // FE-0-72 启用
  },
  {
    key: 'leases',
    label: 'Leases',
    to: '/leases',
    icon: <FileTextOutlined />,
    disabled: true, // FE-0-72 启用
  },
  {
    key: 'payments',
    label: 'Payments',
    to: '/payments',
    icon: <DollarOutlined />,
    disabled: true, // FE-0-72 启用
  },
];
