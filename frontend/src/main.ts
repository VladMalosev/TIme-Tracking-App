import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
declare const M: any;
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
