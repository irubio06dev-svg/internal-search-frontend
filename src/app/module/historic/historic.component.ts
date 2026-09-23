import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

@Component({
    selector: 'app-historic',
    imports: [],
    templateUrl: './historic.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricComponent implements OnInit {
    ngOnInit(): void { }
}
