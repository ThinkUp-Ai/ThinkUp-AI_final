import React from "react";

type Props = {
  onClick: () => void;
};

const ChatIcon: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Chat öffnen"
      className="fixed bottom-5 right-5 z-[99999] h-14 w-14 rounded-full bg-black shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-[#58FFE9] focus:outline-none focus:ring-2 focus:ring-[#58FFE9]/60 hover:scale-110"
    >
      <img
        src="/logo.png"
        alt="ThinkUp-AI Logo"
        className="h-10 w-10 rounded-full object-cover"
        loading="eager"
        decoding="async"
        onError={(e) => {
          // Fallback: Wenn Logo nicht lädt, zeige SVG-Icon
          console.warn("Logo konnte nicht geladen werden, verwende Fallback-Icon");
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent && !parent.querySelector('svg')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('stroke-width', '1.5');
            svg.setAttribute('stroke', '#58FFE9');
            svg.setAttribute('class', 'w-8 h-8');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('d', 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z');
            svg.appendChild(path);
            parent.appendChild(svg);
          }
        }}
      />
    </button>
  );
};

export default ChatIcon;
