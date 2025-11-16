import { Typography, Card, Row, Col } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Dashboard 页面
 * 
 * 占位页面，FE-1 系列任务中实现具体仪表板功能
 */
export default function Dashboard() {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard</Title>
      <Paragraph type="secondary">
        欢迎使用 rrent 管理系统
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Title level={4}>Organizations</Title>
            <Paragraph>待接入数据展示</Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Title level={4}>Properties</Title>
            <Paragraph>待接入数据展示</Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Title level={4}>Tenants</Title>
            <Paragraph>待接入数据展示</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
