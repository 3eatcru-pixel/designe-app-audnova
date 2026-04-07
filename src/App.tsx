import * as React from "react";
import { Settings } from "lucide-react";
import { AuthPage } from "./pages/AuthPage";
import { WorldPage } from "./pages/WorldPage";
import { SecurityHub } from "./pages/SecurityHub";
import { ChatDeck } from "./pages/ChatDeck";
import { ProfilePage } from "./pages/ProfilePage";
import { P2PListPage } from "./pages/P2PListPage";
import { P2PChatPage } from "./pages/P2PChatPage";
import { CreateRadioPage } from "./pages/CreateRadioPage";
import { BadgesListPage } from "./pages/BadgesListPage";
import { FeaturedRadiosPage } from "./pages/FeaturedRadiosPage";
import { MobileLayout } from "./components/MobileLayout";
import { AppState, AuthMode, Page, Radio } from "./types";
import { MOCK_USER, MOCK_RADIOS } from "./constants";
import { cn } from "./lib/utils";

export default function App() {
  const [state, setState] = React.useState<AppState>({
    authMode: "none",
    user: null,
    currentPage: "world",
    selectedRadio: null,
    isSearching: false,
    showEmptyRadios: false,
    showEmptySignal: false,
    isConfigOpen: false,
    selectedFriendId: null,
    lastRadio: null,
    userRadios: [],
    allRadios: MOCK_RADIOS,
  });

  const handleLogin = (mode: AuthMode) => {
    setState((prev) => ({
      ...prev,
      authMode: mode,
      user: mode === "user" ? MOCK_USER : null,
      currentPage: "world",
    }));
  };

  const handleLogout = () => {
    setState((prev) => ({
      ...prev,
      authMode: "none",
      user: null,
      currentPage: "auth",
    }));
  };

  const handleUpdateAvatar = (avatar: string) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, avatar }
      };
    });
  };

  const handlePageChange = (page: Page) => {
    if (page === "chat" && !state.selectedRadio && state.lastRadio) {
      setState((prev) => ({ ...prev, selectedRadio: prev.lastRadio, currentPage: page, isConfigOpen: false }));
    } else {
      setState((prev) => ({ ...prev, currentPage: page, isConfigOpen: false }));
    }
  };

  const handleSelectRadio = (radio: Radio) => {
    setState((prev) => ({ ...prev, selectedRadio: radio, lastRadio: radio, currentPage: "chat" }));
  };

  const handleSelectFriend = (friendId: string) => {
    setState((prev) => ({ ...prev, selectedFriendId: friendId, currentPage: "p2p-chat" }));
  };

  const toggleEmptyRadios = () => {
    setState((prev) => ({ ...prev, showEmptyRadios: !prev.showEmptyRadios }));
  };

  const toggleEmptySignal = () => {
    setState((prev) => ({ ...prev, showEmptySignal: !prev.showEmptySignal }));
  };

  const handleNewRadio = () => {
    if (state.userRadios.length > 0) {
      setState((prev) => ({ ...prev, currentPage: "dj-deck" }));
    } else {
      setState((prev) => ({ ...prev, currentPage: "create-radio" }));
    }
  };

  const handleCreateRadio = (radio: Radio) => {
    setState((prev) => ({ 
      ...prev, 
      userRadios: [radio, ...prev.userRadios], 
      allRadios: [radio, ...prev.allRadios],
      currentPage: "dj-deck",
      selectedRadio: radio 
    }));
  };

  const handleDeleteRadio = (radioId: string) => {
    setState((prev) => ({
      ...prev,
      userRadios: prev.userRadios.filter(r => r.id !== radioId),
      allRadios: prev.allRadios.filter(r => r.id !== radioId),
      selectedRadio: prev.selectedRadio?.id === radioId ? null : prev.selectedRadio,
      currentPage: prev.currentPage === "dj-deck" ? "world" : prev.currentPage
    }));
  };

  const toggleConfig = () => {
    setState((prev) => ({ ...prev, isConfigOpen: !prev.isConfigOpen }));
  };

  const handleLeaveRadio = () => {
    setState((prev) => ({ ...prev, selectedRadio: null, currentPage: "world" }));
  };

  if (state.authMode === "none") {
    return <AuthPage onLogin={handleLogin} />;
  }

  const headerActions = state.currentPage === "dj-deck" ? (
    <button
      onClick={toggleConfig}
      className={cn(
        "w-10 h-10 rounded-xl glass flex items-center justify-center transition-all",
        state.isConfigOpen ? "text-neon-cyan bg-neon-cyan/10" : "text-white/40 hover:text-neon-cyan"
      )}
    >
      <Settings size={18} />
    </button>
  ) : null;

  return (
    <MobileLayout
      currentPage={state.currentPage}
      onPageChange={handlePageChange}
      authMode={state.authMode}
      user={state.user}
      onLogout={handleLogout}
      onNewRadio={handleNewRadio}
      headerActions={headerActions}
      selectedRadio={state.selectedRadio}
      onLeaveRadio={handleLeaveRadio}
    >
      {/* Dev Controls for verification of Empty States */}
      <div className="absolute top-2 right-16 flex gap-1 z-[100]">
        <button 
          onClick={toggleEmptyRadios} 
          className={cn(
            "px-2 py-1 rounded text-[8px] font-bold uppercase transition-all",
            state.showEmptyRadios ? "bg-neon-cyan text-black" : "bg-white/5 text-white/40"
          )}
        >
          R-Empty
        </button>
        <button 
          onClick={toggleEmptySignal} 
          className={cn(
            "px-2 py-1 rounded text-[8px] font-bold uppercase transition-all",
            state.showEmptySignal ? "bg-neon-cyan text-black" : "bg-white/5 text-white/40"
          )}
        >
          S-Empty
        </button>
      </div>

      {state.currentPage === "world" && (
        <WorldPage
          authMode={state.authMode}
          onSelectRadio={handleSelectRadio}
          showEmpty={state.showEmptyRadios}
          showEmptySignal={state.showEmptySignal}
          onToggleEmpty={toggleEmptyRadios}
          radios={state.allRadios}
          onSeeAll={() => handlePageChange("featured-radios")}
        />
      )}

      {state.currentPage === "featured-radios" && (
        <FeaturedRadiosPage
          onBack={() => handlePageChange("world")}
          onSelectRadio={handleSelectRadio}
          radios={state.allRadios}
        />
      )}

      {state.currentPage === "security" && (
        <SecurityHub
          authMode={state.authMode}
          showEmpty={state.showEmptyRadios}
          userRadio={state.userRadios[0] || null}
          onPageChange={handlePageChange}
        />
      )}

      {state.currentPage === "chat" && (
        <ChatDeck
          authMode={state.authMode}
          selectedRadio={state.selectedRadio}
          onClose={() => setState(prev => ({ ...prev, selectedRadio: null, currentPage: "world" }))}
        />
      )}

      {state.currentPage === "profile" && (
        <ProfilePage
          authMode={state.authMode}
          user={state.user}
          onPageChange={handlePageChange}
          onLogout={handleLogout}
          userRadios={state.userRadios}
          onUpdateAvatar={handleUpdateAvatar}
          onDeleteRadio={handleDeleteRadio}
        />
      )}

      {state.currentPage === "badges-list" && (
        <BadgesListPage
          onBack={() => handlePageChange("profile")}
        />
      )}

      {state.currentPage === "dj-deck" && (
        <ChatDeck
          authMode={state.authMode}
          selectedRadio={state.userRadios[0] || null}
          isDJMode={true}
          onClose={() => handlePageChange("world")}
          isConfigOpen={state.isConfigOpen}
          setIsConfigOpen={(val) => setState(prev => ({ ...prev, isConfigOpen: val }))}
        />
      )}

      {state.currentPage === "p2p-list" && (
        <P2PListPage
          onPageChange={handlePageChange}
          onSelectChat={handleSelectFriend}
        />
      )}

      {state.currentPage === "p2p-chat" && (
        <P2PChatPage
          friendId={state.selectedFriendId}
          onPageChange={handlePageChange}
        />
      )}

      {state.currentPage === "create-radio" && (
        <CreateRadioPage
          onBack={() => handlePageChange("world")}
          onCreate={handleCreateRadio}
        />
      )}
    </MobileLayout>
  );
}
