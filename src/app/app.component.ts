import { Component, OnInit } from '@angular/core';

declare global {
  interface Window {
    Intercom: any;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'bio';

  user = {
    name: '{{ request.user.name|escapejs }}',
    email: '{{ request.user.email|escapejs }}',
    created_at: '{{ request.user.date_joined|date:"U" }}'
  };

  ngOnInit() {
    window.Intercom('boot', {
      api_base: 'https://api-iam.intercom.io',
      app_id: 'dgunohch',
      name: this.user.name,
      email: this.user.email,
      created_at: parseInt(this.user.created_at, 10)
    });
  }
}
