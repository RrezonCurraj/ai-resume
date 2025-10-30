import React from 'react';
import ScoreGauge from './ScoreGauge';
import ScoreBadge from './ScoreBadge';
import { useLangStore } from '~/lib/lang';

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor = score > 70 ? 'text-green-600' : score > 49 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
          <ScoreBadge score={score} />
        </div>
        <p className="text-2xl">
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  const { lang } = useLangStore();
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row items-center p-4 gap-8">
        <ScoreGauge score={feedback.overallScore} />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{lang === 'sq' ? 'Pikët e CV-së' : 'Your Resume Score'}</h2>
          <p className="text-sm text-gray-500">
            {lang === 'sq'
              ? 'Ky vlerësim llogaritet bazuar në variablat e listuara më poshtë.'
              : 'This score is calculated based on the variables listed below.'}
          </p>
        </div>
      </div>
      <Category title={lang === 'sq' ? 'Toni & Stili' : 'Tone & Style'} score={feedback.toneAndStyle.score} />
      <Category title={lang === 'sq' ? 'Përmbajtja' : 'Content'} score={feedback.content.score} />
      <Category title={lang === 'sq' ? 'Struktura' : 'Structure'} score={feedback.structure.score} />
      <Category title={lang === 'sq' ? 'Aftësitë' : 'Skills'} score={feedback.skills.score} />
    </div>
  );
};

export default Summary;
