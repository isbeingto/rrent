import { Typography, Card, Row, Col, Statistic, Space } from "antd";
import {
  BankOutlined,
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { Link } from "react-router";

dayjs.locale("zh-cn");

const { Title, Paragraph } = Typography;

export default function Dashboard() {
  const { data: organizationsData } = useList({
    resource: "organizations",
    pagination: { pageSize: 1 },
  });

  const { data: propertiesData } = useList({
    resource: "properties",
    pagination: { pageSize: 1 },
  });

  const { data: tenantsData } = useList({
    resource: "tenants",
    pagination: { pageSize: 1 },
  });

  const { data: leasesData } = useList({
    resource: "leases",
    pagination: { pageSize: 1 },
  });

  const { data: paymentsData } = useList({
    resource: "payments",
    pagination: { pageSize: 1 },
  });

  const { data: pendingPaymentsData } = useList({
    resource: "payments",
    pagination: { pageSize: 1 },
    filters: [{ field: "status", operator: "eq", value: "PENDING" }],
  });

  const { data: overduePaymentsData } = useList({
    resource: "payments",
    pagination: { pageSize: 1 },
    filters: [{ field: "status", operator: "eq", value: "OVERDUE" }],
  });

  const stats = [
    {
      title: "组织数量",
      value: organizationsData?.total ?? 0,
      icon: <BankOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
      link: "/organizations",
    },
    {
      title: "物业数量",
      value: propertiesData?.total ?? 0,
      icon: <HomeOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
      link: "/properties",
    },
    {
      title: "租客数量",
      value: tenantsData?.total ?? 0,
      icon: <UserOutlined style={{ fontSize: 32, color: "#fa8c16" }} />,
      link: "/tenants",
    },
    {
      title: "租约数量",
      value: leasesData?.total ?? 0,
      icon: <FileTextOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
      link: "/leases",
    },
    {
      title: "支付记录",
      value: paymentsData?.total ?? 0,
      icon: <DollarOutlined style={{ fontSize: 32, color: "#eb2f96" }} />,
      link: "/payments",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>仪表盘</Title>
      <Paragraph type="secondary">
        欢迎使用 rrent 管理系统 - {dayjs().format("YYYY年MM月DD日")}
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={8} xl={4.8} key={index}>
            <Link to={stat.link} style={{ display: "block" }}>
              <Card hoverable styles={{ body: { padding: "20px" } }}>
                <Space direction="vertical" style={{ width: "100%" }} size="small">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {stat.icon}
                    <Statistic value={stat.value} valueStyle={{ fontSize: 24, fontWeight: 600 }} />
                  </div>
                  <div style={{ fontSize: 14, color: "#8c8c8c" }}>{stat.title}</div>
                </Space>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="待支付"
              value={pendingPaymentsData?.total ?? 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#faad14" }}
              suffix="笔"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="逾期未付"
              value={overduePaymentsData?.total ?? 0}
              prefix={<FallOutlined />}
              valueStyle={{ color: "#cf1322" }}
              suffix="笔"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
