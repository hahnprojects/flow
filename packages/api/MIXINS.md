## HowTo Mix?
Da wir generische Klassen miteinander mixen sieht unsere Struktur wie folgt aus:
````
import { mix } from 'ts-mixer';

class Foo<T> {
    public fooMethod(input: T): T {
        return input;
    }
}

class Bar<T> {
    public addOne(input: T): T {
    
        ...
        
        return input;
    }
}


interface MixedClass extends Foo<T1>, Bar<T2> { }

@mix(Foo, Bar)
class MixedClass {}


class FooBar extends MixedClass {
    public addOne(input1: T1) {
        // do sth special here
        ...
        // call super method to do standard afterwards
        return super.addOne(input1);
    }
}
````
weitere infos zum Mixin: https://github.com/tannerntannern/ts-mixer

#### Warum wird hier eine 'Zwischen-Klasse' verwendet und nicht direkt die Annotation bei der FooBar-Klasse hinzugefügt?
* Die MixedClass wird hier benötigt, weil Foobar ansonsten von keiner Klasse erben würde und dadurch "super" innerhalb der addOne nicht verwendet werden könnte.


#### Warum für jeden Service eine eigene MixedClass, obwohl sie 'aktuell' überall die gleichen Klassen (DataService und TrashService) extended?
* In Zukunft könnten die einzelnen Services zusätzlich zum Trash - und DataService noch von einem oder mehreren Services erben und diese Mixes können sich je nach Service unterscheiden.

## Warum Mixins?

Mixins werden hier verwendet, um eine SuperClass aus den Services zu kombinieren, dessen (standard-) Methoden in den erbenden Services verwendet werden können.

````
    DataService - Class
    |                 |
    |                 |______________________
    |                                       |
    |    TrashService                       |
    |        |                              |
    |        |                              |
    MixedClass                              |
        |                                   |
        |                                   |
    Services with trash Endpoints          Services without additional, generalized trash Endpoints

````



## Alternativen & Diskussion
// TODO: add your ideas here

Alternativen, die bedacht aber im Hinblick auf Erweiterbarkeit, Wartbarkeit nicht implementiert wurden:

### Trash-Methoden in die einzelnen Services schreiben, wo sie benötigt werden
Erzeugt viel duplizierten Code. (Zusätzliche Methoden in den Services sind nur sinnvoll, wenn es sich um einen Spezialfall handelt.)
* Unübersichtlichkeit: Services würden größer werden, als sie sein müssten

### Trash-Methoden im DataService hinzufügen
Da wir Services haben, die von DataService erben jedoch nicht über die Endpunkte des Papierkorbs verfügen, wäre auch dies keine 'saubere' Lösung

### TrashService extends DataService<T> und Service(WithTrash)<T> extends TrashService
Das würde zwar klappen aber spätestens, wenn man eine Teilmenge der Services, die vom TrashService erben um einen weiteren Service erweitern möchte gibt es Probleme. 
* Nicht erweiterbar
