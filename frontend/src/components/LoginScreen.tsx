import React, { useState, useRef, useCallback } from 'react';
import {
  LoginPage,
  LoginBackground,
  FloatingCard,
  FloatingChip,
  GlowOrb,
  LoginContainer,
  LoginHeader,
  CasinoLogo,
  CasinoTagline,
  LoginForm,
  InputGroup,
  LoginButton,
  AvatarSection,
  AvatarPreview,
  AvatarPlaceholder,
  AvatarInput,
  AvatarLabel,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalOptions,
  ModalOption,
  ModalOptionText,
  CameraContainer,
  CameraPreview,
  CameraActions,
  CameraButton,
} from '../styles/LoginScreen.styles';

interface LoginScreenProps {
  onLogin: (username: string, avatar?: File) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowModal(false);
    }
  };

  const handleAvatarClick = () => {
    setShowModal(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error('Nie udało się uruchomić kamery:', error);
      alert('Nie udało się uruchomić kamery. Sprawdź uprawnienia.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas size to square (crop to center)
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = 320;
        canvas.height = 320;
        
        // Calculate crop position (center)
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        // Draw cropped and scaled image
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            setAvatarFile(file);
            setAvatarPreview(canvas.toDataURL('image/jpeg', 0.9));
            stopCamera();
            setShowModal(false);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [stopCamera]);

  const closeModal = useCallback(() => {
    stopCamera();
    setShowModal(false);
  }, [stopCamera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && !isLoading) {
      setIsLoading(true);
      await onLogin(username.trim(), avatarFile || undefined);
      setIsLoading(false);
    }
  };

  return (
    <LoginPage>
      <LoginBackground>
        <GlowOrb $position="top" />
        <GlowOrb $position="bottom" />
        <FloatingCard $variant={1}>A</FloatingCard>
        <FloatingCard $variant={2}>K</FloatingCard>
        <FloatingCard $variant={3}>Q</FloatingCard>
        <FloatingCard $variant={4}>J</FloatingCard>
      </LoginBackground>

      <LoginContainer>
        <LoginHeader>
          <CasinoLogo>GRAND WAGER</CasinoLogo>
          <CasinoTagline>Szczęście sprzyja odważnym</CasinoTagline>
        </LoginHeader>

        <LoginForm onSubmit={handleSubmit}>
          <h2>Dołącz do gry</h2>
          
          <AvatarSection>
            <AvatarLabel>Twój awatar</AvatarLabel>
            <AvatarPreview onClick={handleAvatarClick}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <AvatarPlaceholder>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                  <span>Kliknij aby dodać</span>
                </AvatarPlaceholder>
              )}
            </AvatarPreview>
            <AvatarInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </AvatarSection>

          <InputGroup>
            <label htmlFor="username">Nazwa gracza</label>
            <input
              id="username"
              type="text"
              placeholder="Wprowadź swoją nazwę"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              maxLength={20}
              disabled={isLoading}
            />
          </InputGroup>

          <LoginButton type="submit" disabled={!username.trim() || isLoading}>
            {isLoading ? (
              <span>Logowanie...</span>
            ) : (
              <>
                <span>Wejdź do kasyna</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </>
            )}
          </LoginButton>
        </LoginForm>
      </LoginContainer>

      {/* Avatar Modal */}
      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{showCamera ? 'Zrób zdjęcie' : 'Wybierz awatar'}</h3>
              <ModalCloseButton onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </ModalCloseButton>
            </ModalHeader>

            {showCamera ? (
              <CameraContainer>
                <CameraPreview>
                  <video ref={videoRef} autoPlay playsInline muted />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </CameraPreview>
                <CameraActions>
                  <CameraButton $variant="secondary" onClick={stopCamera}>
                    Anuluj
                  </CameraButton>
                  <CameraButton $variant="primary" onClick={takePhoto}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    Zrób zdjęcie
                  </CameraButton>
                </CameraActions>
              </CameraContainer>
            ) : (
              <ModalOptions>
                <ModalOption onClick={handleUploadClick}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <ModalOptionText>
                    <span>Wgraj z urządzenia</span>
                    <span>Wybierz zdjęcie z galerii lub plików</span>
                  </ModalOptionText>
                </ModalOption>

                <ModalOption onClick={startCamera}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <ModalOptionText>
                    <span>Zrób zdjęcie</span>
                    <span>Użyj kamery aby zrobić selfie</span>
                  </ModalOptionText>
                </ModalOption>
              </ModalOptions>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </LoginPage>
  );
};

export default LoginScreen;
