import React from 'react';
import useStore from './store';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

function App() {
  const { user } = useStore();

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="h-screen w-full flex bg-[#050505] overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <ChatArea />
    </div>
  );
}

export default App;
