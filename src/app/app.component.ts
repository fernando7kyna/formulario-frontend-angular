import { Component } from '@angular/core';
import { ItemFormComponent } from './item-form/item-form.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [ItemFormComponent]
})
export class AppComponent {
  title = 'meu-formulario';
}
