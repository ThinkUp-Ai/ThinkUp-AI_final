// src/components/chatbot/App.tsx
import React, { useState } from "react"; 
import Chatbot from "./Chatbot";       
import ChatIcon from "./ChatIcon";         

// Der Wrapper (optional, aber guter Stil)
const App: React.FC = () => { // Removed AppProps since it's not used here
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    // Ein einfacher Fragment-Wrapper, da die Positionierung in ChatIcon/Chatbot liegt
    <> 
      
      {/* Icon wird NUR gerendert, wenn der Chat GESCHLOSSEN ist */}
      {!isChatOpen && (
        // ChatIcon benötigt KEINE isVisible Prop mehr, da wir es hier logisch steuern
        <ChatIcon onClick={() => setIsChatOpen(true)} />
      )}
      
      {/* Chatbot wird IMMER gerendert, aber nur über die 'isOpen' Prop sichtbar/animiert */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default App;