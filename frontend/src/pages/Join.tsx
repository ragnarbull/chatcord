import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

export const Join = () => {
  const [existingChannels, setExistingChannels] = useState<string[]>([]);
  const [newChannelInputDisabled, setNewChannelInputDisabled] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [newChannel, setNewChannel] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedChannels = JSON.parse(localStorage.getItem('channels') || '[]') as string[];
    setExistingChannels(storedChannels);
  }, []);

  const toggleNewChannelInput = () => {
    setNewChannelInputDisabled(!selectedChannel);
  };

  const joinChat = () => {
    if (username.length < 3 || !/^[a-zA-Z0-9]+$/.test(username)) {
      alert('Username must be at least 3 characters and contain only letters and numbers.');
      return;
    }

    const channel = selectedChannel || newChannel;

    if (newChannel && !existingChannels.includes(newChannel)) {
      setExistingChannels((prevChannels) => [...prevChannels, newChannel]);
      localStorage.setItem('channels', JSON.stringify(existingChannels));
    }

    navigate(`/chat?username=${encodeURIComponent(username)}&channel=${encodeURIComponent(channel)}`);
  };

  return (
    <Wrapper>
      <JoinContainer>
        <JoinHeader>
          <h1>
            <i className="fas fa-smile"></i> SkyNet
          </h1>
        </JoinHeader>
        <JoinMain>
          <form>
            <FormControl>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Enter username..."
                required
                pattern="[a-zA-Z0-9]{3,}"
                title="Username must be at least 3 characters and contain only letters and numbers."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <label htmlFor="channel">Active Channels</label>
              <select
                name="channel"
                id="channel"
                value={selectedChannel}
                onChange={(e) => {
                  setSelectedChannel(e.target.value);
                  toggleNewChannelInput();
                }}
              >
                <option value="" disabled selected></option>
                {existingChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormControl>
              <label htmlFor="newChannel">New Channel</label>
              <input
                type="text"
                name="newChannel"
                id="newChannel"
                placeholder="Enter new channel name..."
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                // disabled={newChannelInputDisabled}
              />
            </FormControl>
            <JoinButton type="button" onClick={joinChat}>
              Join Chat
            </JoinButton>
          </form>
        </JoinMain>
      </JoinContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  background: var(--light-color);
  margin: 20px;
`;

const JoinContainer = styled.div`
  max-width: 500px;
  margin: 80px auto;
  color: #fff;
`;

const JoinHeader = styled.header`
  text-align: center;
  padding: 20px;
  background: var(--dark-color-a);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
`;

const JoinMain = styled.main`
  padding: 30px 40px;
  background: var(--dark-color-b);
`;

const FormControl = styled.div`
  margin-bottom: 20px;
`;

const JoinButton = styled.button`
  cursor: pointer;
  padding: 5px 15px;
  background: var(--light-color);
  color: var(--dark-color-a);
  border: 0;
  font-size: 17px;
  width: 100%;
  margin-top: 20px;
`;