import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import ScoreCircle from './ScoreTitle';
import { usePuterStore } from '~/lib/puter';

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
  const { fs } = usePuterStore();
  const [resumeURL, setResumeURL] = useState('');

  useEffect(() => {
    const loadResume = async () => {
      const blob = await fs.read(imagePath);
      if (!blob) return;
      let url = URL.createObjectURL(blob);
      setResumeURL(url);
    };

    loadResume();
  }, [imagePath]);

  return (
    <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
          {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
          {!jobTitle && !companyName && <h2 className="!text-black font-bold">Reusme</h2>}
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback.overallScore} />
        </div>
      </div>
      {resumeURL && (
        <div className="gradient-border animate-in fade-in duration-1000 ">
          <div className="w-full h-full">
            <img
              src={resumeURL}
              alt="resume"
              className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/pdf.png') target.src = '/images/pdf.png';
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;
function setResumeURL(url: string) {
  throw new Error('Function not implemented.');
}
