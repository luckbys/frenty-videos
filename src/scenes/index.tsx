import React from 'react';
import type { Scene } from '../types';
import { Composition } from './Composition';
import { Bullets, Chart, Stats } from './Data';
import { Cta, Quote } from './Engage';
import { Interface } from './Interface';
import { Intro, Outro, Text } from './Opening';
import { BigNumber, Compare, IconGrid, Statement, Steps, Testimonial } from './Smart';

export const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case 'intro':
      return <Intro {...scene} />;
    case 'text':
      return <Text {...scene} />;
    case 'bullets':
      return <Bullets {...scene} />;
    case 'stats':
      return <Stats {...scene} />;
    case 'chart':
      return <Chart {...scene} />;
    case 'quote':
      return <Quote {...scene} />;
    case 'cta':
      return <Cta {...scene} />;
    case 'outro':
      return <Outro {...scene} />;
    case 'steps':
      return <Steps {...scene} />;
    case 'compare':
      return <Compare {...scene} />;
    case 'bignumber':
      return <BigNumber {...scene} />;
    case 'icongrid':
      return <IconGrid {...scene} />;
    case 'statement':
      return <Statement {...scene} />;
    case 'testimonial':
      return <Testimonial {...scene} />;
    case 'composition':
      return <Composition {...scene} />;
    case 'ui':
      return <Interface {...scene} />;
  }
};
