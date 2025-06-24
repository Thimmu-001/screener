import React from 'react';
import  SearchScreen  from '@/components/screens/SearchScreen';

export default function SearchTab() {
  return <SearchScreen onTokenSelect={(_token) => { /* handle token selection */ }} />;
}