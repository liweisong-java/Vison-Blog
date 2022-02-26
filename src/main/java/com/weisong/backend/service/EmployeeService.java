package com.weisong.backend.service;

import com.github.pagehelper.PageInfo;
import com.sun.org.apache.xpath.internal.operations.Bool;
import com.weisong.backend.entities.Employee;

import java.util.List;
import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-02-16-21:16
 */
public interface EmployeeService {

    List<Employee> getAllEmp();

    void insertEmp(Employee employee);

    Integer getEnableById(Integer emp_Id);

    void deleteEmpById(Integer emp_Id);

    Boolean changeEnableById(Integer emp_Id);

    Boolean checkUser(String lastName);
}
