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

const CustomizeModal = ({ onClose, onUpdate }: CustomizeModalProps) => {
  const [step, setStep] = useState<Step>('menu');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<'obstacle' | 'player'>('obstacle');

  const customObstacle = getCustomObstacle();
  const customFace = getCustomPlayerFace();

  const handleFileSelect = (target: 'obstacle' | 'player') => {
    targetRef.current = target;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStep(targetRef.current === 'obstacle' ? 'crop-obstacle' : 'crop-player');
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
        onCancel={() => { setFile(null); setStep('menu'); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col items-center gap-5 bg-foreground/90 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-game-ui font-game text-sm">커스텀하기</h3>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Obstacle customize */}
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-muted-foreground text-xs">장애물 이미지</p>
          {customObstacle && (
            <img src={customObstacle} alt="custom obstacle" className="w-16 h-16 rounded-full object-cover border-2 border-game-ui" />
          )}
          <button
            onClick={() => handleFileSelect('obstacle')}
            className="w-full px-4 py-3 bg-accent text-accent-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
          >
            {customObstacle ? '장애물 변경' : '장애물 설정'}
          </button>
        </div>

        {/* Player face customize */}
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-muted-foreground text-xs">플레이어 얼굴</p>
          {customFace && (
            <img src={customFace} alt="custom face" className="w-16 h-16 rounded-full object-cover border-2 border-game-ui" />
          )}
          <button
            onClick={() => handleFileSelect('player')}
            className="w-full px-4 py-3 bg-secondary text-secondary-foreground font-game text-[10px] rounded-lg active:scale-95 transition-all"
          >
            {customFace ? '얼굴 변경' : '얼굴 설정'}
          </button>
        </div>

        {/* Reset */}
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
