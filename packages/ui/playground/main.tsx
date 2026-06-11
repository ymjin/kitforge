import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { today, getLocalTimeZone } from "@internationalized/date";
import {
  I18nProvider,
  Button, TextField, Select, SelectItem, Checkbox, Switch, DatePicker, Modal,
  Textarea, RadioGroup, Radio, Combobox, ComboboxItem, Slider, NumberField,
  Popover, Tooltip, Drawer, AlertDialog, ToastProvider, useToast,
  FileUpload, Avatar, Badge, Card, CardHeader, CardBody, CardFooter, Spinner, Skeleton,
  Tabs, TabList, Tab, TabPanel, Accordion, AccordionItem,
  DropdownMenu, MenuItem, MenuSeparator,
  Table, TableHeader, TableBody, Column, Row, Cell,
  Pagination, Progress, SearchField, Calendar,
} from "../dist/index.js";
import "../dist/styles.css";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
        {children}
      </div>
    </section>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <Button variant="secondary" onPress={() => toast({ title: "저장됨", description: "변경 사항이 저장되었습니다", variant: "success" })}>성공 토스트</Button>
      <Button variant="secondary" onPress={() => toast({ title: "오류", description: "문제가 발생했습니다", variant: "danger" })}>오류 토스트</Button>
      <Button variant="secondary" onPress={() => toast("간단한 알림입니다")}>기본 토스트</Button>
    </div>
  );
}

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [page, setPage] = useState(3);
  const [progress, setProgress] = useState(60);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "2.5rem 1.5rem 6rem", fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>@ymjin/ui · Playground</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>React Aria 기반 · @ymjin/tokens 스타일 · 30개 컴포넌트</p>
      </header>

      <Section title="Buttons">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button isDisabled>Disabled</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </Section>

      <Section title="Form — text">
        <div style={{ width: 240 }}><TextField label="이메일" placeholder="you@company.com" description="회사 이메일을 입력하세요" /></div>
        <div style={{ width: 240 }}><TextField label="이름" errorMessage="필수 항목입니다" /></div>
        <div style={{ width: 240 }}><Textarea label="메모" placeholder="내용을 입력하세요" rows={3} /></div>
        <div style={{ width: 240 }}><SearchField label="검색" placeholder="이름으로 검색" /></div>
        <div style={{ width: 160 }}><NumberField label="수량" defaultValue={3} minValue={0} /></div>
      </Section>

      <Section title="Form — choice">
        <div style={{ width: 220 }}>
          <Select label="국가" placeholder="선택하세요">
            <SelectItem id="kr">대한민국</SelectItem>
            <SelectItem id="us">미국</SelectItem>
            <SelectItem id="jp">일본</SelectItem>
          </Select>
        </div>
        <div style={{ width: 220 }}>
          <Combobox label="도시" placeholder="검색하세요">
            <ComboboxItem id="seoul">서울</ComboboxItem>
            <ComboboxItem id="busan">부산</ComboboxItem>
            <ComboboxItem id="incheon">인천</ComboboxItem>
          </Combobox>
        </div>
        <RadioGroup label="크기" defaultValue="m">
          <Radio value="s">소형</Radio>
          <Radio value="m">중형</Radio>
          <Radio value="l">대형</Radio>
        </RadioGroup>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Checkbox defaultSelected>약관에 동의</Checkbox>
          <Switch defaultSelected>알림 받기</Switch>
        </div>
        <div style={{ width: 220 }}><Slider label="볼륨" defaultValue={40} /></div>
      </Section>

      <Section title="Date">
        <div style={{ width: 240 }}><DatePicker label="생년월일" /></div>
        <Calendar aria-label="날짜 선택" defaultValue={today(getLocalTimeZone())} />
      </Section>

      <Section title="Overlays">
        <Button onPress={() => setModalOpen(true)}>모달 열기</Button>
        <Button onPress={() => setDrawerOpen(true)}>드로어 열기</Button>
        <Button variant="danger" onPress={() => setAlertOpen(true)}>삭제 확인</Button>
        <Popover trigger={<Button variant="outline">팝오버</Button>}>
          <div style={{ width: 180 }}>토큰 기반으로 스타일된 팝오버 패널입니다.</div>
        </Popover>
        <Tooltip content="도움말 텍스트입니다">
          <Button variant="ghost">툴팁 (호버)</Button>
        </Tooltip>
        <DropdownMenu triggerButton={<Button variant="outline">메뉴 ▾</Button>}>
          <MenuItem>프로필</MenuItem>
          <MenuItem>설정</MenuItem>
          <MenuSeparator />
          <MenuItem>로그아웃</MenuItem>
        </DropdownMenu>
        <ToastDemo />
      </Section>

      <Section title="Feedback & display">
        <Badge variant="primary">신규</Badge>
        <Badge variant="success">활성</Badge>
        <Badge variant="warning">대기</Badge>
        <Badge variant="danger">오류</Badge>
        <Spinner />
        <div style={{ width: 260 }}>
          <Progress label="업로드" value={progress} />
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <Button size="sm" variant="outline" onPress={() => setProgress((p) => Math.max(0, p - 10))}>−10</Button>
            <Button size="sm" variant="outline" onPress={() => setProgress((p) => Math.min(100, p + 10))}>+10</Button>
          </div>
        </div>
        <Progress label="처리 중" isIndeterminate />
        <div style={{ width: 180 }}>
          <Skeleton height="1rem" />
          <Skeleton height="1rem" width="70%" style={{ marginTop: "0.5rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Avatar user={{ name: "홍길동" }} />
          <Avatar name="Jane Doe" size="lg" />
          <Avatar src="https://i.pravatar.cc/80" name="사진" size="lg" />
        </div>
      </Section>

      <Section title="Card & FileUpload">
        <Card style={{ width: 280 }}>
          <CardHeader>프로필</CardHeader>
          <CardBody>토큰 기반으로 스타일된 카드 컴포넌트입니다.</CardBody>
          <CardFooter><Button size="sm">자세히</Button></CardFooter>
        </Card>
        <div style={{ width: 320 }}>
          <FileUpload label="첨부 파일" acceptedFileTypes={["image/png", "image/jpeg"]} />
        </div>
      </Section>

      <Section title="Navigation & data">
        <div style={{ width: "100%" }}>
          <Tabs defaultSelectedKey="a">
            <TabList aria-label="예시 탭">
              <Tab id="a">개요</Tab>
              <Tab id="b">상세</Tab>
              <Tab id="c">설정</Tab>
            </TabList>
            <TabPanel id="a">개요 탭 내용입니다.</TabPanel>
            <TabPanel id="b">상세 탭 내용입니다.</TabPanel>
            <TabPanel id="c">설정 탭 내용입니다.</TabPanel>
          </Tabs>
        </div>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <Accordion defaultExpandedKeys={["q1"]}>
            <AccordionItem id="q1" title="배송 기간은 얼마나 걸리나요?">평일 기준 2-3일 소요됩니다.</AccordionItem>
            <AccordionItem id="q2" title="환불이 가능한가요?">수령 후 7일 이내 환불 가능합니다.</AccordionItem>
          </Accordion>
        </div>
        <div style={{ width: "100%" }}>
          <Table aria-label="사용자 목록">
            <TableHeader>
              <Column isRowHeader id="name">이름</Column>
              <Column id="email">이메일</Column>
              <Column id="role">역할</Column>
            </TableHeader>
            <TableBody>
              <Row id="1"><Cell>홍길동</Cell><Cell>hong@example.com</Cell><Cell>관리자</Cell></Row>
              <Row id="2"><Cell>김철수</Cell><Cell>kim@example.com</Cell><Cell>사용자</Cell></Row>
              <Row id="3"><Cell>이영희</Cell><Cell>lee@example.com</Cell><Cell>사용자</Cell></Row>
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} totalPages={20} onPageChange={setPage} />
      </Section>

      {/* Overlays mounted at root */}
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} title="모달 제목" isDismissable>
        {({ close }) => (
          <div>
            <p style={{ color: "#475569" }}>포커스 트랩 · 스크롤 잠금 · Esc 닫기가 모두 동작합니다.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <Button variant="ghost" onPress={close}>닫기</Button>
              <Button onPress={close}>확인</Button>
            </div>
          </div>
        )}
      </Modal>

      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen} title="드로어" placement="right" isDismissable>
        {({ close }) => (
          <div>
            <p style={{ color: "#475569" }}>오른쪽에서 슬라이드되는 패널입니다.</p>
            <Button variant="ghost" onPress={close}>닫기</Button>
          </div>
        )}
      </Drawer>

      <AlertDialog
        isOpen={alertOpen}
        onOpenChange={setAlertOpen}
        title="정말 삭제할까요?"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={() => undefined}
      >
        이 작업은 되돌릴 수 없습니다.
      </AlertDialog>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider locale="ko-KR">
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  </StrictMode>,
);
