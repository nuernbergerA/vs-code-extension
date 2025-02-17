import * as assert from "assert";
import * as vscode from "vscode";
import { parse } from "../support/parser";

const getResult = (obj = {}) => ({
    class: null,
    fqn: null,
    function: null,
    classDefinition: null,
    classExtends: null,
    classImplements: [],
    functionDefinition: null,
    additionalInfo: null,
    param: {
        index: 0,
        isArray: false,
        isKey: false,
        key: null,
        keys: [],
    },
    parameters: [],
    ...obj,
});

const getParam = (obj = {}) => ({
    index: 0,
    isArray: false,
    isKey: false,
    key: null,
    keys: [],
    ...obj,
});

suite("Parser Test Suite", () => {
    vscode.window.showInformationMessage("Start parser tests.");

    test("there is nothing to complete", () => {
        const code = `<?php
        Route::get('/', function () {
        config('')`;

        const expected = null;

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("basic function", () => {
        const code = `<?php
        Route::get('/', function () {
        config('`;

        const expected = getResult({
            function: "config",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("class and static method", () => {
        const code = `<?php

        Route::get('`;

        const expected = getResult({
            function: "get",
            fqn: "Route",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("class and chained method", () => {
        const code = `<?php
        User::where('name', 'something')->get('`;

        const expected = getResult({
            function: "get",
            fqn: "User",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("typehinted class and method", () => {
        const code = `<?php

        Route::get('/', function (User $user) {
        $user->where('name', 'something')->find('`;

        const expected = getResult({
            function: "find",
            fqn: "User",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("red herring typehinted class and method without typehint", () => {
        const code = `<?php

        Route::get('/', function (NotUser $user) {
        $user->where('name', 'something')->find();
        });

        Route::get('/', function ($user) {
        $user->where('name', 'something')->find('`;

        const expected = getResult({
            function: "find",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("it will not get sidetracked by other variables in unrelated closures", () => {
        const code = `<?php

        Route::get('/', function (User $user) {

        $user->where(function($q) {
            $q->where('something', 'something else');
        })->find('');

        $user->where('name', 'something')->find('`;

        const expected = getResult({
            fqn: "User",
            function: "find",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("variable of instantiated class and method", () => {
        const code = `<?php

        Route::get('/', function () {

        $user = new User();
        $user->where('name', 'something')->find('`;

        const expected = getResult({
            fqn: "User",
            function: "find",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("variable of class and static method", () => {
        const code = `<?php

        Route::get('/', function () {

        $user = User::make();
        $user->where('name', 'something')->find('`;

        const expected = getResult({
            fqn: "User",
            function: "find",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("variable but just method", () => {
        const code = `<?php

        Route::get('/', function () {
        $user = $anotherThing;
        $user->where('name', 'something')->find('`;

        const expected = getResult({
            function: "find",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("variable of fqn and method", () => {
        const code = `<?php

        Route::get('/', function () {
        $user = App\\Models\\User::make();
        $user->where('name', 'something')->find('`;

        const expected = getResult({
            fqn: "App\\Models\\User",
            function: "find",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("first param position", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("find fqn from use", () => {
        const code = `<?php
        use App\\Models\\User;
        use App\\Models\\Post;

        Route::get('/', function () {
        User::where('`;

        const expected = getResult({
            fqn: "App\\Models\\User",
            function: "where",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("find fqn from alias", () => {
        const code = `<?php
        use App\\Models\\User as UserModel;

        Route::get('/', function () {
        UserModel::where('`;

        const expected = getResult({
            fqn: "App\\Models\\User",
            function: "where",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("find fqn from alias with other use statement", () => {
        const code = `<?php
        use App\\User;
        use App\\Models\\User as UserModel;

        Route::get('/', function () {
        UserModel::where('`;

        const expected = getResult({
            fqn: "App\\Models\\User",
            function: "where",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("second param position", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('first', '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
            }),
            parameters: ["first"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("array params", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where(['what' => 'ok'], '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
            }),
            parameters: ["['what'=>'ok']"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("string and array params", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('first', ['what' => 'ok'], '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 2,
            }),
            parameters: ["first", "['what'=>'ok']"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("callback param", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where(function($thing) {
            return $thing;
        }, '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
            }),
            parameters: ["function($thing){return $thing;}"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("short callback param", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where(fn($thing) => $thing, '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
            }),
            parameters: ["fn($thing)=>$thing"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("parameter grab bag", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('ok', [1, 2, 3], 5, function($thing) {
            return $thing;
        }, ['hi' => 'there'], '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 5,
            }),
            parameters: [
                "ok",
                "[1,2,3]",
                "5",
                "function($thing){return $thing;}",
                "['hi'=>'there']",
            ],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("parameter array key detection", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('ok', ['`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
                isArray: true,
                isKey: true,
            }),
            parameters: ["ok"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("parameter array key detection when further along in the array", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('ok', ['sure' => 'thing', '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
                isArray: true,
                isKey: true,
                keys: ["sure"],
            }),
            parameters: ["ok"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("parameter array key detection when simple array", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('ok', ['sure', '`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
                isArray: true,
                isKey: true,
                keys: ["sure"],
            }),
            parameters: ["ok"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("it will handle nested arrays correctly", () => {
        const code = `<?php

        Route::get('/', function () {
        User::where('ok', ['sure', ['`;

        const expected = getResult({
            fqn: "User",
            function: "where",
            param: getParam({
                index: 1,
                isArray: true,
                isKey: false,
                keys: ["sure"],
            }),
            parameters: ["ok"],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("it will detect class being defined", () => {
        const code = `<?php
        namespace App\\Models;

        use Illuminate\\Database\\Eloquent\\Model;
        use Something\\Else\\Authenticable;
        use Something\\Else\\Also;

        class User extends Model implements Authenticable, Also {
            public function something() {
                return $this->where('`;

        const expected = getResult({
            classDefinition: "App\\Models\\User",
            classExtends: "Illuminate\\Database\\Eloquent\\Model",
            classImplements: [
                "Something\\Else\\Authenticable",
                "Something\\Else\\Also",
            ],
            functionDefinition: "something",
            function: "where",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("it will detect class being defined in a different order", () => {
        const code = `<?php
        namespace App\\Models;

        use Illuminate\\Database\\Eloquent\\Model;
        use Something\\Else\\Authenticable;
        use Something\\Else\\Also;

        class User implements Authenticable, Also extends Model {
            public function something() {
                return $this->where('`;

        const expected = getResult({
            classDefinition: "App\\Models\\User",
            classExtends: "Illuminate\\Database\\Eloquent\\Model",
            classImplements: [
                "Something\\Else\\Authenticable",
                "Something\\Else\\Also",
            ],
            functionDefinition: "something",
            function: "where",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });

    test("it will be able to figure out fqn of property", () => {
        const code = `<?php

        use App\\Models\\User;

        class Whatever {
            protected User $user;

            public function something() {
                return $this->user->where('`;

        const expected = getResult({
            classDefinition: "Whatever",
            functionDefinition: "something",
            function: "where",
            fqn: "App\\Models\\User",
            param: getParam(),
            parameters: [],
        });

        const result = parse(code);

        assert.deepStrictEqual(result, expected);
    });
});
