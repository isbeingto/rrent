import { Typography, Card, Empty, Button, Space } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import React from "react";

const { Title, Paragraph, Text } = Typography;

/**
 * Tenants List 页面
 *
 * 占位级实现 - FE-0-72 任务
 * 后续在 FE-1 系列任务中对接真实 API
 */
const TenantsList: React.FC = () => {
  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Tenants
          </Title>
          <Paragraph type="secondary">管理租户信息（占位页面）</Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新增
          </Button>
        </Space>
      </div>

      <Card>
        <Empty description="暂无数据" style={{ padding: "40px 0" }} />
        <Paragraph type="secondary" style={{ textAlign: "center" }}>
          <Text>该页面正在开发中，敬请期待...</Text>
        </Paragraph>
      </Card>
    </div>
  );
};

export default TenantsList;
