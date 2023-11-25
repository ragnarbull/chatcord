import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import io from 'socket.io-client';

export const ChatPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get('username');
  const channel = queryParams.get('channel');

  const [channelName, setChannelName] = useState<string>('');
  const [users, setUsers] = useState<{ id: string; username: string, channel: string }[]>([]);
  const [messages, setMessages] = useState<{ username: string; time: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  useEffect(() => {
    const socket = io('https://localhost:3000');

    socket.emit('joinChannel', { username, channel });

    socket.on('channelUsers', ({ channel, users }) => {
      setChannelName(channel);
      console.log("channel:", channel);

      setUsers(users);
      console.log("updated users:", users);
    });

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [username, channel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (newMessage.trim() !== '') {
      const socket = io('http://localhost:3000');
      socket.emit('chatMessage', { text: newMessage, user: { username, id: socket.id }, channel });
      setNewMessage('');
    }
  };

  return (
    <ChatPageContainer>
      <h2>Welcome, {username}!</h2>
      <Container>
        <Header>
          <h1>
            <i className="fas fa-smile"></i> SkyNet
          </h1>
          <a id="leave-btn">
            Leave Channel
          </a>
        </Header>
        <Main>
          <Sidebar>
            <SidebarHeading>
              <i className="fas fa-comments"></i> Channel Name:
            </SidebarHeading>
            <h2 id="channel-name">{channelName}</h2>
            <SidebarHeading>
              <i className="fas fa-users"></i> Users
            </SidebarHeading>
            <SidebarUsers>
              {users.map((user) => (
                <li key={user.id}>{user.username}</li>
              ))}
            </SidebarUsers>
          </Sidebar>
          <Messages>
            {messages.map((message, index) => (
              <div key={index} className="message">
                <p className="meta">
                  {message.username.toString()}
                  <span>{message.time.toString()}</span>
                </p>
                <p className="text">{message.text.toString()}</p>
              </div>
            ))}
          </Messages>
        </Main>
        <FormContainer>
          <Form onSubmit={handleSendMessage}>
            <Input
              id="msg"
              type="text"
              placeholder="Enter Message"
              required
              autoComplete="off"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <SendButton type="submit">
              <i className="fas fa-paper-plane"></i> Send
            </SendButton>
          </Form>
        </FormContainer>
      </Container>
    </ChatPageContainer>
  );
};

const ChatPageContainer = styled.div``;

const Container = styled.div`
  max-width: 1100px;
  background: #fff;
  margin: 30px auto;
  overflow: hidden;
`;

const Header = styled.header`
  background: var(--dark-color-a);
  color: #fff;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Main = styled.main`
  display: grid;
  grid-template-columns: 1fr 3fr;
`;

const Sidebar = styled.div`
  background: var(--dark-color-b);
  color: #fff;
  padding: 20px 20px 60px;
  overflow-y: scroll;
`;

const SidebarHeading = styled.h2`
  font-size: 20px;
  background: rgba(0, 0, 0, 0.1);
  padding: 10px;
  margin-bottom: 20px;
`;

const SidebarUsers = styled.ul`
  list-style: none;
`;

const Messages = styled.div`
  padding: 30px;
  max-height: 500px;
  overflow-y: scroll;
`;

const FormContainer = styled.div`
  padding: 20px 30px;
  background-color: var(--dark-color-a);
`;

const Form = styled.form`
  display: flex;
`;

const Input = styled.input`
  font-size: 16px;
  padding: 5px;
  height: 40px;
  flex: 1;
`;

const SendButton = styled.button`
  cursor: pointer;
  padding: 5px 15px;
  background: var(--light-color);
  color: var(--dark-color-a);
  border: 0;
  font-size: 17px;
`;
