// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/foundation/protocol/database/database.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../../protocol/common.pb.dart' as $0;
import 'database.pbenum.dart';

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

export 'database.pbenum.dart';

class Filter extends $pb.GeneratedMessage {
  factory Filter({
    $core.String? column,
    FilterOperator? operator,
    $0.Json? value,
    $core.bool? negated,
  }) {
    final result = create();
    if (column != null) result.column = column;
    if (operator != null) result.operator = operator;
    if (value != null) result.value = value;
    if (negated != null) result.negated = negated;
    return result;
  }

  Filter._();

  factory Filter.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Filter.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Filter',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.database.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'column')
    ..aE<FilterOperator>(2, _omitFieldNames ? '' : 'operator',
        enumValues: FilterOperator.values)
    ..aOM<$0.Json>(3, _omitFieldNames ? '' : 'value',
        subBuilder: $0.Json.create)
    ..aOB(4, _omitFieldNames ? '' : 'negated')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Filter clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Filter copyWith(void Function(Filter) updates) =>
      super.copyWith((message) => updates(message as Filter)) as Filter;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Filter create() => Filter._();
  @$core.override
  Filter createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Filter getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Filter>(create);
  static Filter? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get column => $_getSZ(0);
  @$pb.TagNumber(1)
  set column($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasColumn() => $_has(0);
  @$pb.TagNumber(1)
  void clearColumn() => $_clearField(1);

  @$pb.TagNumber(2)
  FilterOperator get operator => $_getN(1);
  @$pb.TagNumber(2)
  set operator(FilterOperator value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasOperator() => $_has(1);
  @$pb.TagNumber(2)
  void clearOperator() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Json get value => $_getN(2);
  @$pb.TagNumber(3)
  set value($0.Json value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasValue() => $_has(2);
  @$pb.TagNumber(3)
  void clearValue() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Json ensureValue() => $_ensure(2);

  @$pb.TagNumber(4)
  $core.bool get negated => $_getBF(3);
  @$pb.TagNumber(4)
  set negated($core.bool value) => $_setBool(3, value);
  @$pb.TagNumber(4)
  $core.bool hasNegated() => $_has(3);
  @$pb.TagNumber(4)
  void clearNegated() => $_clearField(4);
}

class FilterGroup extends $pb.GeneratedMessage {
  factory FilterGroup({
    $core.Iterable<Filter>? filters,
    $core.Iterable<FilterGroup>? groups,
    $core.bool? disjunction,
  }) {
    final result = create();
    if (filters != null) result.filters.addAll(filters);
    if (groups != null) result.groups.addAll(groups);
    if (disjunction != null) result.disjunction = disjunction;
    return result;
  }

  FilterGroup._();

  factory FilterGroup.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory FilterGroup.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'FilterGroup',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.database.v1'),
      createEmptyInstance: create)
    ..pPM<Filter>(1, _omitFieldNames ? '' : 'filters',
        subBuilder: Filter.create)
    ..pPM<FilterGroup>(2, _omitFieldNames ? '' : 'groups',
        subBuilder: FilterGroup.create)
    ..aOB(3, _omitFieldNames ? '' : 'disjunction')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  FilterGroup clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  FilterGroup copyWith(void Function(FilterGroup) updates) =>
      super.copyWith((message) => updates(message as FilterGroup))
          as FilterGroup;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static FilterGroup create() => FilterGroup._();
  @$core.override
  FilterGroup createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static FilterGroup getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<FilterGroup>(create);
  static FilterGroup? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<Filter> get filters => $_getList(0);

  @$pb.TagNumber(2)
  $pb.PbList<FilterGroup> get groups => $_getList(1);

  @$pb.TagNumber(3)
  $core.bool get disjunction => $_getBF(2);
  @$pb.TagNumber(3)
  set disjunction($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasDisjunction() => $_has(2);
  @$pb.TagNumber(3)
  void clearDisjunction() => $_clearField(3);
}

class Order extends $pb.GeneratedMessage {
  factory Order({
    $core.String? column,
    $core.bool? descending,
    $core.bool? nullsFirst,
  }) {
    final result = create();
    if (column != null) result.column = column;
    if (descending != null) result.descending = descending;
    if (nullsFirst != null) result.nullsFirst = nullsFirst;
    return result;
  }

  Order._();

  factory Order.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Order.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Order',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.database.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'column')
    ..aOB(2, _omitFieldNames ? '' : 'descending')
    ..aOB(3, _omitFieldNames ? '' : 'nullsFirst')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Order clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Order copyWith(void Function(Order) updates) =>
      super.copyWith((message) => updates(message as Order)) as Order;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Order create() => Order._();
  @$core.override
  Order createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Order getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Order>(create);
  static Order? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get column => $_getSZ(0);
  @$pb.TagNumber(1)
  set column($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasColumn() => $_has(0);
  @$pb.TagNumber(1)
  void clearColumn() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.bool get descending => $_getBF(1);
  @$pb.TagNumber(2)
  set descending($core.bool value) => $_setBool(1, value);
  @$pb.TagNumber(2)
  $core.bool hasDescending() => $_has(1);
  @$pb.TagNumber(2)
  void clearDescending() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.bool get nullsFirst => $_getBF(2);
  @$pb.TagNumber(3)
  set nullsFirst($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasNullsFirst() => $_has(2);
  @$pb.TagNumber(3)
  void clearNullsFirst() => $_clearField(3);
}

class Range extends $pb.GeneratedMessage {
  factory Range({
    $core.int? limit,
    $core.int? offset,
  }) {
    final result = create();
    if (limit != null) result.limit = limit;
    if (offset != null) result.offset = offset;
    return result;
  }

  Range._();

  factory Range.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Range.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Range',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.database.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'limit', fieldType: $pb.PbFieldType.OU3)
    ..aI(2, _omitFieldNames ? '' : 'offset', fieldType: $pb.PbFieldType.OU3)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Range clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Range copyWith(void Function(Range) updates) =>
      super.copyWith((message) => updates(message as Range)) as Range;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Range create() => Range._();
  @$core.override
  Range createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Range getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Range>(create);
  static Range? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get limit => $_getIZ(0);
  @$pb.TagNumber(1)
  set limit($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasLimit() => $_has(0);
  @$pb.TagNumber(1)
  void clearLimit() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.int get offset => $_getIZ(1);
  @$pb.TagNumber(2)
  set offset($core.int value) => $_setUnsignedInt32(1, value);
  @$pb.TagNumber(2)
  $core.bool hasOffset() => $_has(1);
  @$pb.TagNumber(2)
  void clearOffset() => $_clearField(2);
}

class Query extends $pb.GeneratedMessage {
  factory Query({
    $core.String? table,
    Operation? operation,
    $core.Iterable<$core.String>? select,
    FilterGroup? where,
    $core.Iterable<Order>? order,
    Range? range,
    $core.bool? single,
    $core.bool? countExact,
    $0.Json? payload,
    $core.Iterable<$core.String>? onConflict,
    $core.String? rpcName,
    $0.Json? rpcArgs,
  }) {
    final result = create();
    if (table != null) result.table = table;
    if (operation != null) result.operation = operation;
    if (select != null) result.select.addAll(select);
    if (where != null) result.where = where;
    if (order != null) result.order.addAll(order);
    if (range != null) result.range = range;
    if (single != null) result.single = single;
    if (countExact != null) result.countExact = countExact;
    if (payload != null) result.payload = payload;
    if (onConflict != null) result.onConflict.addAll(onConflict);
    if (rpcName != null) result.rpcName = rpcName;
    if (rpcArgs != null) result.rpcArgs = rpcArgs;
    return result;
  }

  Query._();

  factory Query.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Query.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Query',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.database.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'table')
    ..aE<Operation>(2, _omitFieldNames ? '' : 'operation',
        enumValues: Operation.values)
    ..pPS(3, _omitFieldNames ? '' : 'select')
    ..aOM<FilterGroup>(4, _omitFieldNames ? '' : 'where',
        subBuilder: FilterGroup.create)
    ..pPM<Order>(5, _omitFieldNames ? '' : 'order', subBuilder: Order.create)
    ..aOM<Range>(6, _omitFieldNames ? '' : 'range', subBuilder: Range.create)
    ..aOB(7, _omitFieldNames ? '' : 'single')
    ..aOB(8, _omitFieldNames ? '' : 'countExact')
    ..aOM<$0.Json>(9, _omitFieldNames ? '' : 'payload',
        subBuilder: $0.Json.create)
    ..pPS(10, _omitFieldNames ? '' : 'onConflict')
    ..aOS(11, _omitFieldNames ? '' : 'rpcName')
    ..aOM<$0.Json>(12, _omitFieldNames ? '' : 'rpcArgs',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Query clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Query copyWith(void Function(Query) updates) =>
      super.copyWith((message) => updates(message as Query)) as Query;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Query create() => Query._();
  @$core.override
  Query createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Query getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Query>(create);
  static Query? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get table => $_getSZ(0);
  @$pb.TagNumber(1)
  set table($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasTable() => $_has(0);
  @$pb.TagNumber(1)
  void clearTable() => $_clearField(1);

  @$pb.TagNumber(2)
  Operation get operation => $_getN(1);
  @$pb.TagNumber(2)
  set operation(Operation value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasOperation() => $_has(1);
  @$pb.TagNumber(2)
  void clearOperation() => $_clearField(2);

  @$pb.TagNumber(3)
  $pb.PbList<$core.String> get select => $_getList(2);

  @$pb.TagNumber(4)
  FilterGroup get where => $_getN(3);
  @$pb.TagNumber(4)
  set where(FilterGroup value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasWhere() => $_has(3);
  @$pb.TagNumber(4)
  void clearWhere() => $_clearField(4);
  @$pb.TagNumber(4)
  FilterGroup ensureWhere() => $_ensure(3);

  @$pb.TagNumber(5)
  $pb.PbList<Order> get order => $_getList(4);

  @$pb.TagNumber(6)
  Range get range => $_getN(5);
  @$pb.TagNumber(6)
  set range(Range value) => $_setField(6, value);
  @$pb.TagNumber(6)
  $core.bool hasRange() => $_has(5);
  @$pb.TagNumber(6)
  void clearRange() => $_clearField(6);
  @$pb.TagNumber(6)
  Range ensureRange() => $_ensure(5);

  @$pb.TagNumber(7)
  $core.bool get single => $_getBF(6);
  @$pb.TagNumber(7)
  set single($core.bool value) => $_setBool(6, value);
  @$pb.TagNumber(7)
  $core.bool hasSingle() => $_has(6);
  @$pb.TagNumber(7)
  void clearSingle() => $_clearField(7);

  @$pb.TagNumber(8)
  $core.bool get countExact => $_getBF(7);
  @$pb.TagNumber(8)
  set countExact($core.bool value) => $_setBool(7, value);
  @$pb.TagNumber(8)
  $core.bool hasCountExact() => $_has(7);
  @$pb.TagNumber(8)
  void clearCountExact() => $_clearField(8);

  @$pb.TagNumber(9)
  $0.Json get payload => $_getN(8);
  @$pb.TagNumber(9)
  set payload($0.Json value) => $_setField(9, value);
  @$pb.TagNumber(9)
  $core.bool hasPayload() => $_has(8);
  @$pb.TagNumber(9)
  void clearPayload() => $_clearField(9);
  @$pb.TagNumber(9)
  $0.Json ensurePayload() => $_ensure(8);

  @$pb.TagNumber(10)
  $pb.PbList<$core.String> get onConflict => $_getList(9);

  @$pb.TagNumber(11)
  $core.String get rpcName => $_getSZ(10);
  @$pb.TagNumber(11)
  set rpcName($core.String value) => $_setString(10, value);
  @$pb.TagNumber(11)
  $core.bool hasRpcName() => $_has(10);
  @$pb.TagNumber(11)
  void clearRpcName() => $_clearField(11);

  @$pb.TagNumber(12)
  $0.Json get rpcArgs => $_getN(11);
  @$pb.TagNumber(12)
  set rpcArgs($0.Json value) => $_setField(12, value);
  @$pb.TagNumber(12)
  $core.bool hasRpcArgs() => $_has(11);
  @$pb.TagNumber(12)
  void clearRpcArgs() => $_clearField(12);
  @$pb.TagNumber(12)
  $0.Json ensureRpcArgs() => $_ensure(11);
}

class QueryResult extends $pb.GeneratedMessage {
  factory QueryResult({
    $0.Json? data,
    $fixnum.Int64? count,
    $0.Failure? error,
  }) {
    final result = create();
    if (data != null) result.data = data;
    if (count != null) result.count = count;
    if (error != null) result.error = error;
    return result;
  }

  QueryResult._();

  factory QueryResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory QueryResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'QueryResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.database.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Json>(1, _omitFieldNames ? '' : 'data', subBuilder: $0.Json.create)
    ..a<$fixnum.Int64>(2, _omitFieldNames ? '' : 'count', $pb.PbFieldType.OU6,
        defaultOrMaker: $fixnum.Int64.ZERO)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueryResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueryResult copyWith(void Function(QueryResult) updates) =>
      super.copyWith((message) => updates(message as QueryResult))
          as QueryResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static QueryResult create() => QueryResult._();
  @$core.override
  QueryResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static QueryResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<QueryResult>(create);
  static QueryResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Json get data => $_getN(0);
  @$pb.TagNumber(1)
  set data($0.Json value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasData() => $_has(0);
  @$pb.TagNumber(1)
  void clearData() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Json ensureData() => $_ensure(0);

  @$pb.TagNumber(2)
  $fixnum.Int64 get count => $_getI64(1);
  @$pb.TagNumber(2)
  set count($fixnum.Int64 value) => $_setInt64(1, value);
  @$pb.TagNumber(2)
  $core.bool hasCount() => $_has(1);
  @$pb.TagNumber(2)
  void clearCount() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Failure get error => $_getN(2);
  @$pb.TagNumber(3)
  set error($0.Failure value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasError() => $_has(2);
  @$pb.TagNumber(3)
  void clearError() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Failure ensureError() => $_ensure(2);
}

class DatabaseApi {
  final $pb.RpcClient _client;

  DatabaseApi(this._client);

  $async.Future<QueryResult> execute($pb.ClientContext? ctx, Query request) =>
      _client.invoke<QueryResult>(
          ctx, 'Database', 'Execute', request, QueryResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
