import { useState, useRef } from 'react';
import CircularCropModal from './CircularCropModal';
import {
  saveCustomObstacle,
  saveCustomPlayerFace,
  getCustomObstacle,
  getCustomPlayerFace,
  clearCustomImages,
} from '@/game/customization';

interface CustomizeModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

type Step = 'menu' | 'crop-obstacle' | 'crop-player';
type Target = 'obstacle' | 'player';
type SourceType = 'gallery' | 'camera';

const CustomizeModal = ({ onClose, onUpdate }: CustomizeModalProps) => {
  const [step, setStep] = useState<Step>('menu');
  const [file, setFile] = useState<File | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<Target>('obstacle');

  const customObstacle = getCustomObstacle();
  const customFace = getCustomPlayerFace();

  const handleFileSelect = (target: Target, sourceType: SourceType) => {
    targetRef.current = target;
    if (sourceType === 'camera') {
      cameraInputRef.current?.click();
      return;
    }
    galleryInputRef.current?.click();
  };

  const handleSelectedFile = (f: File | null | undefined) => {
    if (!f) return;
    setFile(f);
    setStep(targetRef.current === 'obstacle' ? 'crop-obstacle' : 'crop-player');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSelectedFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleCrop = (dataUrl: string) => {
    if (step === 'crop-obstacle') {
      saveCustomObstacle(dataUrl);
    } else {
      saveCustomPlayerFace(dataUrl);
    }
    setFile(null);
    setStep('menu');
    onUpdate();
  };

  const handleReset = () => {
    clearCustomImages();
    onUpdate();
  };

  if (step !== 'menu' && file) {
    return (
      <CircularCropModal
        imageFile={file}
        title={step === 'crop-obstacle' ? '장애물 이미지 편집' : '플레이어 얼굴 편집'}
        onCrop={handleCrop}
        onCancel={() => {
          setFile(null);
          setStep('menu');
        }}
      />
    );
  }

  const UploadButtons = ({
    target,
    galleryLabel,
    cameraLabel,
  }: {
    target: Target;
    galleryLabel: string;
    cameraLabel: string;
  }) => (
    <div className="grid grid-cols-2 gap-2 w-full">
      <button
        onClick={() => handleFileSelect(target, 'gallery')}
        className="w-full px-3 py-3 bg-primary text-primary-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
      >
        {galleryLabel}
      </button>
      <button
        onClick={() => handleFileSelect(target, 'camera')}
        className="w-full px-3 py-3 bg-secondary text-secondary-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
      >
        {cameraLabel}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col items-center gap-5 bg-foreground/90 rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-game-ui font-game text-sm">커스텀하기</h3>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-muted-foreground text-xs">장애물 이미지</p>
          {customObstacle && (
            <img src={customObstacle} alt="custom obstacle" className="w-16 h-16 rounded-full object-cover border-2 border-game-ui" />
          )}
          <UploadButtons
            target="obstacle"
            galleryLabel={customObstacle ? '앨범에서 장애물 변경' : '앨범에서 장애물 선택'}
            cameraLabel="카메라 촬영"
          />
        </div>

        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-muted-foreground text-xs">플레이어 얼굴</p>
          {customFace && (
            <img src={customFace} alt="custom face" className="w-16 h-16 rounded-full object-cover border-2 border-game-ui" />
          )}
          <UploadButtons
            target="player"
            galleryLabel={customFace ? '앨범에서 얼굴 변경' : '앨범에서 얼굴 선택'}
            cameraLabel="카메라 촬영"
          />
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            선택한 얼굴 사진은 제공된 몸 PNG 위에 자동으로 붙습니다.
          </p>
        </div>

        {(customObstacle || customFace) && (
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-destructive/20 text-destructive font-game text-[10px] rounded-lg active:scale-95 transition-all"
          >
            초기화
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-muted text-muted-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default CustomizeModal;
