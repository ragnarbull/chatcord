import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import styled from "styled-components";

import {
  Error,
  ChatPage,
  Join,
} from "./pages";

export const App = () => {
  return (
    <Router>
      <PageContainer>
        <Routes>
          <Route path='/' element={<Join />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/*" element={<ChatPage />} />
          <Route path='*' element={<Error />} />
        </Routes>
      </PageContainer>
    </Router>
  );
};

const PageContainer = styled.div`
  // justify-content: space-between;
  // padding: 1.5rem;
  // align-items: center;
  height: 100vh;
`;
