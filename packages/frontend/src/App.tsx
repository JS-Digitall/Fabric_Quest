//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { ContentProvider } from './game/content/ContentProvider';
import { GameApp } from './game/GameApp';

function App() {
  return (
    <ContentProvider>
      <GameApp />
    </ContentProvider>
  );
}

export default App;
